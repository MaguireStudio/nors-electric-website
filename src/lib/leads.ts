import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { services } from "@/content/site";
import {
  type LeadInput,
  PROPERTY_TYPES,
  URGENCY_OPTIONS,
  BUDGET_RANGES,
  CONTACT_METHODS,
  HEARD_ABOUT,
} from "./lead-fields";

// Re-exported so server code has a single import for the whole lead module.
export * from "./lead-fields";

export type StoredLead = Omit<LeadInput, "company" | "consent"> & {
  id: string;
  receivedAt: string;
  consent: true;
  status: "new";
};

/**
 * Where leads.jsonl lives.
 *
 * On Vercel (and most serverless platforms) the deployment filesystem is
 * READ-ONLY apart from /tmp — writing to process.cwd() throws EROFS, which
 * would fail every single submission. So we fall back to /tmp there: still
 * ephemeral, but writable, which keeps the write a working safety net rather
 * than a guaranteed error. Durable storage is the notification email and the
 * CRM webhook; set LEADS_DATA_DIR to a mounted volume when self-hosting.
 */
const DATA_DIR =
  process.env.LEADS_DATA_DIR ||
  (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
    ? "/tmp/nors-leads"
    : path.join(process.cwd(), "data"));

const LEADS_FILE = path.join(DATA_DIR, "leads.jsonl");

/** True when at least one durable destination is configured. */
export function hasDurableDestination(): boolean {
  const email = Boolean(
    process.env.RESEND_API_KEY &&
      process.env.LEAD_NOTIFICATION_EMAIL &&
      process.env.LEAD_FROM_EMAIL,
  );
  return email || Boolean(process.env.LEAD_WEBHOOK_URL);
}

/**
 * Appends the lead to a newline-delimited JSON file.
 *
 * NOTE ON HOSTING: serverless platforms (Vercel, Netlify Functions) have an
 * ephemeral filesystem — this file survives the request but not the deploy.
 * It is a safety net so a lead is never silently lost mid-request. The
 * durable copies are the notification email and the CRM webhook below.
 * If you self-host on a VPS or container with a mounted volume, this file
 * IS durable and /admin/leads will read it back.
 */
export async function persistLead(lead: StoredLead): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.appendFile(LEADS_FILE, JSON.stringify(lead) + "\n", "utf8");
}

export async function readLeads(): Promise<StoredLead[]> {
  try {
    const raw = await fs.readFile(LEADS_FILE, "utf8");
    return raw
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line) as StoredLead;
        } catch {
          return null;
        }
      })
      .filter((l): l is StoredLead => l !== null)
      .reverse();
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

function labelFor(
  opts: readonly { value: string; label: string }[],
  value: string | undefined,
): string {
  if (!value) return "—";
  return opts.find((o) => o.value === value)?.label ?? value;
}

export function serviceNames(slugs: string[]): string {
  return slugs
    .map((slug) => services.find((s) => s.slug === slug)?.name ?? "Something else")
    .join(", ");
}

export function formatLeadAsText(lead: StoredLead): string {
  return [
    `New service request — NORS Electric`,
    ``,
    `Name:            ${lead.name}`,
    `Phone:           ${lead.phone}`,
    `Email:           ${lead.email}`,
    `Address:         ${[lead.address, lead.city, lead.zip].filter(Boolean).join(", ") || "—"}`,
    ``,
    `Property:        ${labelFor(PROPERTY_TYPES, lead.propertyType)}`,
    `Interested in:   ${serviceNames(lead.serviceSlugs)}`,
    `Timeline:        ${labelFor(URGENCY_OPTIONS, lead.urgency)}`,
    `Budget:          ${labelFor(BUDGET_RANGES, lead.budget || undefined)}`,
    ``,
    `Contact by:      ${labelFor(CONTACT_METHODS, lead.preferredContact)}`,
    `Best time:       ${lead.bestTime || "—"}`,
    `Heard about us:  ${labelFor(HEARD_ABOUT, lead.heardAbout || undefined)}`,
    ``,
    `Details:`,
    lead.details,
    ``,
    `---`,
    `Submitted ${new Date(lead.receivedAt).toLocaleString("en-US", { timeZone: "America/Chicago" })} (Central) from ${lead.sourcePage || "the website"}`,
    `Reference: ${lead.id}`,
  ].join("\n");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatLeadAsHtml(lead: StoredLead): string {
  const row = (k: string, v: string) =>
    `<tr><td style="padding:6px 14px 6px 0;color:#616d87;font-size:13px;white-space:nowrap;vertical-align:top">${escapeHtml(
      k,
    )}</td><td style="padding:6px 0;color:#1c202a;font-size:14px;font-weight:600">${escapeHtml(v)}</td></tr>`;

  const urgent = lead.urgency === "emergency";

  return `<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:620px">
  ${urgent ? `<p style="background:#fef2f2;border-left:4px solid #dc2626;padding:12px 16px;color:#991b1b;font-weight:700;margin:0 0 20px">⚠ Marked as an EMERGENCY — call this customer first.</p>` : ""}
  <h2 style="margin:0 0 4px;color:#101319;font-size:20px">New service request</h2>
  <p style="margin:0 0 20px;color:#616d87;font-size:13px">${escapeHtml(
    new Date(lead.receivedAt).toLocaleString("en-US", { timeZone: "America/Chicago" }),
  )} Central · from ${escapeHtml(lead.sourcePage || "the website")}</p>
  <table style="border-collapse:collapse;width:100%">
    ${row("Name", lead.name)}
    ${row("Phone", lead.phone)}
    ${row("Email", lead.email)}
    ${row("Address", [lead.address, lead.city, lead.zip].filter(Boolean).join(", ") || "—")}
    ${row("Property", labelFor(PROPERTY_TYPES, lead.propertyType))}
    ${row("Interested in", serviceNames(lead.serviceSlugs))}
    ${row("Timeline", labelFor(URGENCY_OPTIONS, lead.urgency))}
    ${row("Budget", labelFor(BUDGET_RANGES, lead.budget || undefined))}
    ${row("Contact by", labelFor(CONTACT_METHODS, lead.preferredContact))}
    ${row("Best time", lead.bestTime || "—")}
    ${row("Heard about us", labelFor(HEARD_ABOUT, lead.heardAbout || undefined))}
  </table>
  <h3 style="margin:24px 0 6px;color:#101319;font-size:15px">Details</h3>
  <p style="margin:0;white-space:pre-wrap;color:#3e4658;font-size:14px;line-height:1.6">${escapeHtml(lead.details)}</p>
  <p style="margin:24px 0 0;color:#aeb5c4;font-size:12px">Reference ${escapeHtml(lead.id)}</p>
</div>`;
}

/** Emails the office via Resend. Returns false when unconfigured, throws when it fails. */
async function sendNotificationEmail(lead: StoredLead): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_NOTIFICATION_EMAIL;
  const from = process.env.LEAD_FROM_EMAIL;
  if (!apiKey || !to || !from) return false;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: to.split(",").map((s) => s.trim()),
      reply_to: lead.email,
      subject:
        (lead.urgency === "emergency" ? "[EMERGENCY] " : "") +
        `New request: ${serviceNames(lead.serviceSlugs)} — ${lead.name}`,
      html: formatLeadAsHtml(lead),
      text: formatLeadAsText(lead),
    }),
  });

  if (!res.ok) {
    throw new Error(`Resend responded ${res.status}: ${await res.text()}`);
  }

  return true;
}

/** POSTs the lead to a CRM / Zapier / Make webhook. Returns false when unconfigured. */
async function sendWebhook(lead: StoredLead): Promise<boolean> {
  const url = process.env.LEAD_WEBHOOK_URL;
  if (!url) return false;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.LEAD_WEBHOOK_SECRET
        ? { "X-Webhook-Secret": process.env.LEAD_WEBHOOK_SECRET }
        : {}),
    },
    body: JSON.stringify(lead),
  });

  if (!res.ok) {
    throw new Error(`Webhook responded ${res.status}`);
  }

  return true;
}

/**
 * Whether the file written by `persistLead` outlives the request.
 *
 * On Vercel and Lambda it does not — DATA_DIR is /tmp there, which is wiped
 * between deploys and not shared between instances. An explicit LEADS_DATA_DIR
 * means the operator mounted a real volume, so the file is the durable copy.
 */
export function isFileStorageDurable(): boolean {
  if (process.env.LEADS_DATA_DIR) return true;
  return !(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

export type NotifyOutcome = {
  /** Destinations that were configured and therefore actually tried. */
  attempted: string[];
  /** Destinations that accepted the lead. */
  delivered: string[];
  /** Destinations that were tried and rejected it. */
  failed: { destination: string; reason: string }[];
};

/**
 * Fans the lead out to every configured destination and REPORTS what happened.
 *
 * Individual failures are never thrown — one broken destination must not stop
 * the other — but they are not swallowed either. A configured-but-failing
 * destination (an expired Resend key, an unverified sending domain) is
 * indistinguishable from success to the customer unless the caller can see
 * this outcome, and on a serverless host that silence loses the lead entirely.
 */
export async function notifyNewLead(lead: StoredLead): Promise<NotifyOutcome> {
  const destinations = [
    { name: "email", send: () => sendNotificationEmail(lead) },
    { name: "webhook", send: () => sendWebhook(lead) },
  ];

  const outcome: NotifyOutcome = { attempted: [], delivered: [], failed: [] };

  const results = await Promise.allSettled(destinations.map((d) => d.send()));

  results.forEach((result, i) => {
    const { name } = destinations[i];

    if (result.status === "rejected") {
      const reason = result.reason instanceof Error ? result.reason.message : String(result.reason);
      outcome.attempted.push(name);
      outcome.failed.push({ destination: name, reason });
      console.error(`[leads] ${lead.id} ${name} notification failed:`, result.reason);
      return;
    }

    // `false` means the destination is not configured, so it was never tried.
    if (result.value) {
      outcome.attempted.push(name);
      outcome.delivered.push(name);
    }
  });

  return outcome;
}

/** Very small in-memory rate limiter — enough to blunt casual form spam. */
const hits = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

/** Drops expired entries so the Map cannot grow without bound. */
function sweepExpired(now: number): void {
  for (const [k, v] of hits) {
    if (now > v.resetAt) hits.delete(k);
  }
}

export function rateLimit(key: string): { ok: boolean; retryAfter: number } {
  const now = Date.now();

  // Cheap amortized cleanup: without this, every distinct client IP stays
  // resident for the lifetime of the process.
  if (hits.size > 500) sweepExpired(now);

  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, retryAfter: 0 };
  }

  entry.count += 1;
  if (entry.count > MAX_PER_WINDOW) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfter: 0 };
}

export function newLeadId(): string {
  return `NE-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
}
