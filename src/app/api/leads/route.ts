import { NextRequest, NextResponse } from "next/server";
import {
  leadSchema,
  persistLead,
  notifyNewLead,
  rateLimit,
  newLeadId,
  hasDurableDestination,
  isFileStorageDurable,
  type StoredLead,
} from "@/lib/leads";
import { site } from "@/content/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientKey(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: NextRequest) {
  const limit = rateLimit(clientKey(req));
  if (!limit.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: "Too many requests from this connection. Please call us instead.",
      },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return NextResponse.json(
      { ok: false, error: "Please check the highlighted fields.", fieldErrors },
      { status: 422 },
    );
  }

  // Honeypot: silently accept so the bot believes it succeeded, but store nothing.
  if (parsed.data.company) {
    return NextResponse.json({ ok: true, reference: newLeadId() });
  }

  const { company: _company, ...rest } = parsed.data;

  const lead: StoredLead = {
    ...rest,
    consent: true,
    id: newLeadId(),
    receivedAt: new Date().toISOString(),
    status: "new",
  };

  let persisted = true;
  try {
    await persistLead(lead);
  } catch (err) {
    persisted = false;
    console.error(`[leads] ${lead.id} persist failed:`, err);
  }

  const notified = await notifyNewLead(lead);

  // A lead survives this request only if it landed somewhere that outlives it:
  // a durable file, or a notification destination that actually accepted it.
  // On Vercel the file is /tmp, so a configured-but-failing Resend key leaves
  // NOTHING behind — and telling the customer "received" in that state is how
  // a real job gets lost. Say so instead, and point them at the phone.
  const recoverable = (persisted && isFileStorageDurable()) || notified.delivered.length > 0;

  if (!recoverable) {
    console.error(
      `[leads] ${lead.id} COULD NOT BE RECORDED ANYWHERE DURABLE. ` +
        (hasDurableDestination()
          ? `Destinations are configured but every one failed: ${notified.failed
              .map((f) => `${f.destination} (${f.reason})`)
              .join("; ")}`
          : `No notification destination is configured. Set RESEND_API_KEY + ` +
            `LEAD_NOTIFICATION_EMAIL + LEAD_FROM_EMAIL, or LEAD_WEBHOOK_URL.`),
    );

    return NextResponse.json(
      {
        ok: false,
        error: site.phoneConfirmed
          ? `We could not record your request. Please call us at ${site.phone} so it doesn't get lost.`
          : "We could not record your request. Please reach out on Facebook or Instagram so it doesn't get lost.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, reference: lead.id });
}
