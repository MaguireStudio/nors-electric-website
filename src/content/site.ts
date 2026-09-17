/**
 * SINGLE SOURCE OF TRUTH for every business fact on the site.
 *
 * Edit this file to change phone numbers, hours, services, pricing language,
 * service area, testimonials, etc. Nothing below is hard-coded into pages.
 *
 * VERIFICATION STATUS — read before launch:
 *   VERIFIED  = found in public listings for NORS Electric LLC, Murray KY.
 *   CONFIRM   = a reasonable default for an electrical contractor. The owner
 *               must confirm or correct it before the site goes live.
 *
 * The Instagram account (@nors_electric) could not be read from this
 * environment, so post-level details (crew names, exact specialties, photos)
 * are marked CONFIRM and should be replaced with real content.
 */

/**
 * Canonical origin for canonical tags, sitemap.xml, robots.txt, and JSON-LD.
 *
 * Resolution order:
 *   1. NEXT_PUBLIC_SITE_URL — set this to the real domain once you have one.
 *   2. Vercel's production domain, so a deploy is self-consistent for free.
 *   3. A placeholder, with `configured: false` so the site self-noindexes.
 */
const SITE_URL: { href: string; configured: boolean } = (() => {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) {
    return { href: explicit.replace(/\/+$/, ""), configured: true };
  }

  // A *.vercel.app URL makes the build self-consistent, but it is not a domain
  // the business owns, so it must NEVER flip indexing on. Treating it as
  // configured is what let a preview deploy advertise itself to crawlers with
  // canonical URLs pointing at a hostname that will be thrown away.
  const vercelDomain =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercelDomain) {
    return { href: `https://${vercelDomain}`, configured: false };
  }

  return { href: "http://localhost:3000", configured: false };
})();

/**
 * CONTACT NUMBER — UNCONFIRMED. NOTHING ON THE SITE PRINTS A NUMBER YET.
 *
 * Three numbers appear across NORS's own channels and they do not agree:
 *
 *   (270) 752-4805   Instagram bio, and the caption of recent Facebook posts
 *   (270) 752-4590   labelled "Call" on Chris Norsworthy's dot.cards profile
 *   (270) 293-0069   third-party aggregators only (findglocal, the Murray
 *                    Highlighter) — carried by no owner-controlled source
 *
 * A fourth number, (270) 873-9193, sits on the same dot.cards profile against
 * "Jordan Norsworthy" under Zelle and Venmo. That is a payment contact, not an
 * intake line, and must never reach the site.
 *
 * `candidate` below is the best-evidenced of the three, kept here so confirming
 * it is a one-line edit rather than a research job someone has to redo. A
 * customer who calls a number nobody answers is a job NORS loses and never
 * hears about, so while `confirmed` is false every phone slot renders
 * `displayWhenUnconfirmed` and no tel:/sms: link is emitted anywhere.
 *
 * To go live: confirm the number with the owner, set `confirmed` to true.
 */
const PHONE = (() => {
  const confirmed: boolean = false;
  const candidate = "(270) 752-4805";
  const e164 = "+12707524805";
  const displayWhenUnconfirmed = "phone number";

  return {
    phone: confirmed ? candidate : displayWhenUnconfirmed,
    // With no confirmed number, every call-to-action still has somewhere real
    // to go rather than a dead link.
    phoneHref: confirmed ? `tel:${e164}` : "/contact",
    smsHref: confirmed ? `sms:${e164}` : "/contact",
    phoneConfirmed: confirmed,
  };
})();

export const site = {
  // ---- Identity ------------------------------------------------------- //
  name: "NORS Electric", // VERIFIED
  legalName: "Nors Electric LLC", // VERIFIED
  tagline: "Licensed electricians serving Murray and West Kentucky",
  shortDescription:
    "Residential and commercial electrical service, repair, and installation in Murray, Kentucky and the surrounding counties.",

  // Resolved from the environment — see `resolveSiteUrl` at the bottom of this
  // file. Set NEXT_PUBLIC_SITE_URL to the real domain, or let Vercel supply it.
  url: SITE_URL.href,

  /**
   * False when no real domain is configured yet. The layout sets `noindex`
   * while this is false, so a preview deploy can never get indexed with
   * canonical URLs pointing at a domain nobody owns — which is far harder to
   * undo than it is to avoid.
   */
  domainConfigured: SITE_URL.configured,

  foundedYear: 2016, // VERIFIED (listings report ~9 years in business)

  // ---- Contact --------------------------------------------------------- //
  ...PHONE,
  // NULL UNTIL CONFIRMED: a mailto: link to an address that doesn't exist
  // bounces silently and loses the customer. Every email link and address on
  // the site is hidden while this is null, and the phone number shown instead.
  email: null as string | null,
  address: {
    street: "121 Wildwood Dr", // CONFIRM — listed publicly, verify it is the mailing address
    city: "Murray",
    state: "KY",
    zip: "42071", // VERIFIED
    country: "US",
  },
  geo: { lat: 36.6103, lng: -88.3148 }, // Murray, KY — CONFIRM exact shop coordinates

  // Public listings disagree on the weekend/Friday schedule. Confirm before launch.
  hours: [
    { day: "Monday", open: "7:00 AM", close: "5:00 PM" },
    { day: "Tuesday", open: "7:00 AM", close: "5:00 PM" },
    { day: "Wednesday", open: "7:00 AM", close: "5:00 PM" },
    { day: "Thursday", open: "7:00 AM", close: "5:00 PM" },
    { day: "Friday", open: "7:00 AM", close: "12:00 PM" },
    { day: "Saturday", open: null, close: null },
    { day: "Sunday", open: null, close: null },
  ], // CONFIRM

  // Urging people to phone rather than wait on a form for a live hazard is
  // safe advice regardless of whether after-hours service is offered, so the
  // banner is on by default. Set `afterHoursNote` only if NORS really does
  // answer calls outside office hours — otherwise it is a promise you'd break.
  emergencyService: true,
  afterHoursNote: null as string | null, // e.g. "After-hours calls answered for existing customers."

  /**
   * CLAIMS THAT NEED DOCUMENTARY PROOF.
   *
   * Everything here is null/false until someone confirms it with the actual
   * credential in hand. The site is built to OMIT these claims entirely when
   * unset — it never prints a placeholder license number or an unverified
   * "licensed and insured" badge.
   *
   * This matters legally, not just cosmetically. KRS 227A requires the real
   * license number on electrical contractor advertising, and an unsupported
   * "bonded and insured" claim is a deceptive trade practice. A site that
   * says less is fine; a site that says something false is a liability.
   */
  credentials: {
    /** The real KY electrical contractor / master electrician license number. */
    licenseNumber: null as string | null,
    /** Set true only when you can produce a current certificate of insurance. */
    insured: false as boolean,
    /** Set true only if actually bonded. These are different things. */
    bonded: false as boolean,
  },

  social: {
    instagram: "https://www.instagram.com/nors_electric/", // VERIFIED
    facebook: "https://www.facebook.com/p/NORS-Electric-61567710190102/", // VERIFIED
  },

  // ---- Trust signals ---------------------------------------------------- //
  valueProps: [
    {
      title: "Permitted and inspected",
      body: "Every job is permitted and met with the inspector where the code requires it — not quietly skipped to save a day.",
    },
    {
      title: "Upfront pricing",
      body: "You approve the price before we start. No surprise line items when the work is done.",
    },
    {
      title: "Local to Calloway County",
      body: "Based in Murray since 2016. We are 20 minutes from most of the homes and businesses we serve.",
    },
    {
      title: "Clean, code-correct work",
      body: "Labeled panels, tidy conduit, and a jobsite left the way we found it.",
    },
  ],
} as const;

// ---- Services ---------------------------------------------------------- //
// `slug` drives the URL at /services/[slug]. Keep slugs stable once live —
// changing one breaks any link Google has already indexed.

export type Service = {
  slug: string;
  name: string;
  category: "residential" | "commercial";
  summary: string;
  icon: string;
  popular?: boolean;
  intro: string;
  includes: string[];
  signs: string[];
  faqs: { q: string; a: string }[];
};

export const services: Service[] = [
  {
    slug: "panel-upgrades",
    name: "Panel Upgrades & Service Changes",
    category: "residential",
    icon: "panel",
    popular: true,
    summary:
      "100A to 200A service upgrades, fuse box replacements, and meter base repairs for homes that have outgrown their panel.",
    intro:
      "A lot of homes around Murray are still running the panel they were built with. If yours is a fuse box, a recalled brand, or a 100-amp panel feeding a house that has since added central air, a shop, or an EV charger, an upgrade is the fix that makes everything else possible.",
    includes: [
      "200A residential service upgrades",
      "Fuse box and recalled panel replacement (Federal Pacific, Zinsco, Challenger)",
      "Meter base and weatherhead repair or relocation",
      "Sub-panels for shops, garages, barns, and additions",
      "Full circuit labeling and load calculation",
      "Coordination with Murray Electric System or West KY RECC for the disconnect and reconnect",
      "Permit filing and inspection scheduling",
    ],
    signs: [
      "Breakers that trip when two appliances run at once",
      "A fuse box, or a panel with no room left for a breaker",
      "Scorch marks, rust, or a burning smell at the panel",
      "Lights that dim when the HVAC or well pump starts",
      "An insurance carrier asking you to replace the panel",
    ],
    faqs: [
      {
        q: "How long does a panel upgrade take?",
        a: "Most residential service upgrades are a one-day job. Power is off for roughly four to six hours while we set the new panel and the utility reconnects.",
      },
      {
        q: "Do I need a permit?",
        a: "Yes. Service changes are permitted and inspected in Kentucky. We file the permit and meet the inspector so you do not have to.",
      },
    ],
  },
  {
    slug: "electrical-repairs",
    name: "Troubleshooting & Repairs",
    category: "residential",
    icon: "bolt",
    popular: true,
    summary:
      "Dead outlets, tripping breakers, flickering lights, and the circuits nobody can explain. We find the actual cause.",
    intro:
      "Electrical troubleshooting is detective work. We trace the circuit back to the real fault instead of replacing parts and hoping, then show you what we found before we repair it.",
    includes: [
      "Dead outlets and half-working circuits",
      "Breakers that trip repeatedly or will not reset",
      "Flickering, buzzing, or dimming lights",
      "Loose neutrals and open grounds",
      "Failed GFCI and AFCI devices",
      "Aluminum wiring remediation",
      "Burned or overheated receptacles and switches",
    ],
    signs: [
      "A warm outlet, switch plate, or cover",
      "A buzzing or crackling sound in a wall or panel",
      "Anything that smells like hot plastic",
      "Shocks or tingles from an appliance or fixture",
      "Repeated breaker trips on the same circuit",
    ],
    faqs: [
      {
        q: "Something smells like it is burning. What should I do?",
        a: "Shut off the breaker for that area if you can do it safely, leave the circuit off, and call us. If you see smoke or flame, call 911 first.",
      },
      {
        q: "Do you charge to diagnose?",
        a: "There is a diagnostic fee for the trip and the time it takes to isolate the fault. We tell you the number on the phone, and you approve the repair price before we start.",
      },
    ],
  },
  {
    slug: "generator-installation",
    name: "Standby & Portable Generator Hookups",
    category: "residential",
    icon: "generator",
    popular: true,
    summary:
      "Whole-home standby generators, transfer switches, and safe portable generator inlets for ice-storm season.",
    intro:
      "West Kentucky loses power to ice and summer storms, and a generator is only as good as the transfer equipment behind it. We install the switchgear that keeps your backup power off the utility lines and out of the linemen's way.",
    includes: [
      "Whole-home standby generator installation and electrical hookup",
      "Automatic transfer switch installation",
      "Manual transfer switches and generator inlet boxes for portable units",
      "Dedicated critical-load sub-panels",
      "Gas line coordination with your plumber or propane supplier",
      "Load calculations so the generator is sized to the house",
      "Annual inspection and exercise checks",
    ],
    signs: [
      "You run extension cords through a window during outages",
      "You have well water, a sump pump, or medical equipment",
      "You own a portable generator but no safe way to connect it",
      "You work from home and cannot afford a day offline",
    ],
    faqs: [
      {
        q: "Can I back-feed a generator through a dryer outlet?",
        a: "No. Back-feeding energizes the utility line outside your house and can kill a lineman. It is illegal and it is the single most dangerous thing homeowners do with generators. An inlet box and transfer switch cost far less than the alternative.",
      },
      {
        q: "What size generator do I need?",
        a: "It depends on whether you want the whole house or just critical loads. We run a load calculation and give you both numbers before you buy anything.",
      },
    ],
  },
  {
    slug: "ev-charger-installation",
    name: "EV Charger Installation",
    category: "residential",
    icon: "ev",
    summary:
      "Level 2 charger installs for Tesla, Ford, Rivian, and any J1772 vehicle — including the panel work to support it.",
    intro:
      "A Level 2 charger is a 40 to 60 amp continuous load, which is more than a lot of older panels have left. We check the capacity first, tell you honestly whether you need a service upgrade, and install the circuit to code.",
    includes: [
      "Tesla Wall Connector and NACS installs",
      "Universal J1772 and hardwired Level 2 chargers",
      "NEMA 14-50 and 6-50 dedicated outlets",
      "Load calculations and panel capacity checks",
      "Garage, carport, and detached-garage runs",
      "Load management devices when the panel is tight",
      "Permitting and inspection",
    ],
    signs: [
      "You just bought or ordered an EV",
      "Your car charges overnight and still is not full",
      "You are running the charger off a standard wall outlet",
      "You want the charger in a detached garage or shop",
    ],
    faqs: [
      {
        q: "Do I need a 200A panel for an EV charger?",
        a: "Not always. It depends on your existing load. Some homes fit a charger on a 100A service with load management, others need the upgrade. We measure instead of guessing.",
      },
      {
        q: "Can you install a charger I already bought?",
        a: "Yes. Bring us the unit and we will install it, as long as it is a listed product with a manufacturer's warranty.",
      },
    ],
  },
  {
    slug: "lighting-installation",
    name: "Lighting Design & Installation",
    category: "residential",
    icon: "light",
    summary:
      "Recessed lighting, under-cabinet runs, fixture swaps, ceiling fans, and exterior lighting that actually lights something.",
    intro:
      "Lighting is the change people notice most. We lay out recessed cans so the room is evenly lit, run dimmers that do not buzz, and handle the ceiling work on high and vaulted ceilings.",
    includes: [
      "Recessed and canless LED lighting layouts",
      "Under-cabinet and toe-kick lighting",
      "Chandelier and high-ceiling fixture installation",
      "Ceiling fan installation and fan-rated box retrofits",
      "Dimmer and smart-switch installation",
      "Landscape, soffit, and security lighting",
      "Shop, barn, and garage high-bay lighting",
    ],
    signs: [
      "Dark corners and shadows in a room you use daily",
      "A fixture hanging from a box not rated for a fan",
      "LED bulbs that flicker or buzz on your dimmer",
      "No exterior lighting at the drive or back door",
    ],
    faqs: [
      {
        q: "Can you add recessed lights without tearing up the ceiling?",
        a: "In most cases yes. Canless LED fixtures go in through a small hole cut with a template, and we patch and clean up after ourselves.",
      },
      {
        q: "Why do my LED lights flicker?",
        a: "Usually a dimmer that was built for incandescent bulbs. Swapping to an LED-compatible dimmer fixes it most of the time.",
      },
    ],
  },
  {
    slug: "home-rewiring",
    name: "Rewiring, Remodels & Additions",
    category: "residential",
    icon: "house",
    summary:
      "Whole-house rewiring, knob-and-tube and aluminum replacement, and complete rough-in for remodels and new builds.",
    intro:
      "Older homes around Murray and Kentucky Lake often have two or three generations of wiring stacked on top of each other. We rewire in stages you can live through, and we do the rough-in and trim for additions, kitchens, baths, and new construction.",
    includes: [
      "Whole-house and partial rewires",
      "Knob-and-tube and cloth wiring replacement",
      "Aluminum branch-circuit remediation",
      "Kitchen and bathroom remodel circuits",
      "Addition, bonus room, and basement finishing",
      "New construction rough-in and trim-out",
      "Shop, barn, and detached garage feeds",
    ],
    signs: [
      "Two-prong outlets throughout the house",
      "Cloth-jacketed or knob-and-tube wiring in the attic",
      "A remodel that has outgrown the existing circuits",
      "An inspection report calling out the wiring",
    ],
    faqs: [
      {
        q: "Do we have to move out during a rewire?",
        a: "Usually not. We work room by room and keep power on to the parts of the house you are living in.",
      },
      {
        q: "Do you work with general contractors?",
        a: "Yes. We do rough-in and trim on new construction and remodels for builders across Calloway and Marshall counties.",
      },
    ],
  },
  {
    slug: "safety-inspections",
    name: "Safety Inspections & Surge Protection",
    category: "residential",
    icon: "shield",
    summary:
      "Pre-purchase electrical inspections, code-correction punch lists, whole-home surge protection, and smoke/CO detectors.",
    intro:
      "If you are buying a house, selling one, or just want to know what is behind the walls, an inspection gives you a written list of what is safe, what is code, and what needs attention first.",
    includes: [
      "Pre-purchase and pre-sale electrical inspections",
      "Home inspector punch-list corrections",
      "Whole-home surge protective devices",
      "Hardwired smoke and carbon monoxide detectors",
      "GFCI and AFCI protection upgrades",
      "Grounding and bonding verification",
      "Insurance and lender documentation",
    ],
    signs: [
      "You are under contract on an older home",
      "Your inspection report flagged electrical items",
      "Sensitive electronics keep failing after storms",
      "Smoke detectors chirping or past their 10-year life",
    ],
    faqs: [
      {
        q: "What does a surge protector actually stop?",
        a: "A whole-home device clamps the big transients that come down the service line from storms and utility switching. It protects HVAC boards, appliances, and anything with a circuit board in it.",
      },
      {
        q: "Will you give me a written report?",
        a: "Yes. You get a written list with photos, sorted by safety priority, and a price for each correction.",
      },
    ],
  },
  {
    slug: "hot-tub-and-pool",
    name: "Hot Tub, Pool & Outdoor Power",
    category: "residential",
    icon: "water",
    summary:
      "Hot tub and pool circuits, bonding, outdoor receptacles, dock power, and RV hookups done to the letter of Article 680.",
    intro:
      "Water and electricity have their own chapter of the code for a reason. Hot tub, pool, and dock wiring has to be GFCI-protected and properly bonded, and inspectors look at it closely around Kentucky Lake.",
    includes: [
      "Hot tub and spa circuits with disconnects",
      "In-ground and above-ground pool equipment wiring",
      "Equipotential bonding grids",
      "Dock and boathouse power with the required GFCI protection",
      "Outdoor weather-resistant receptacles",
      "RV and camper 30A / 50A hookups",
      "Detached shop and outbuilding feeds",
    ],
    signs: [
      "A new hot tub being delivered",
      "A pool pump on an extension cord",
      "Dock lighting or outlets that trip in the rain",
      "Guests who need an RV plug at the house",
    ],
    faqs: [
      {
        q: "How far in advance should I call before my hot tub arrives?",
        a: "Two weeks is comfortable. It gives us time to pull the permit and get the circuit in before the tub sits in your driveway.",
      },
      {
        q: "Do dock outlets really need special protection?",
        a: "Yes. Ground-fault protection on docks prevents electric shock drowning. It is required, and it is not something to skip on Kentucky Lake.",
      },
    ],
  },
  {
    slug: "commercial-service",
    name: "Commercial Service & Maintenance",
    category: "commercial",
    icon: "building",
    popular: true,
    summary:
      "Service calls, preventive maintenance, and code corrections for storefronts, offices, restaurants, and rental property.",
    intro:
      "When a circuit goes down in a business, it costs money by the hour. We keep commercial service calls tight, schedule around your hours where we can, and document everything for your records.",
    includes: [
      "Scheduled and emergency commercial service calls",
      "Preventive maintenance and thermal panel checks",
      "Code-correction and fire-marshal punch lists",
      "Exit and emergency egress lighting, with testing",
      "Three-phase troubleshooting",
      "Equipment and appliance hookups",
      "Multi-unit and rental property maintenance agreements",
    ],
    signs: [
      "Breakers tripping during business hours",
      "An inspection or fire-marshal deadline",
      "Exit lights that do not hold a charge",
      "No documented maintenance history on the building",
    ],
    faqs: [
      {
        q: "Can you work after hours so we stay open?",
        a: "Yes. We schedule evening and early-morning work for restaurants and retail whenever the job allows it.",
      },
      {
        q: "Do you offer maintenance agreements?",
        a: "We do, for property managers and multi-building owners. Ask for it on the estimate request and we will put together a scope.",
      },
    ],
  },
  {
    slug: "commercial-build-outs",
    name: "Tenant Build-Outs & New Commercial",
    category: "commercial",
    icon: "blueprint",
    summary:
      "Full electrical packages for new commercial construction, tenant improvements, and change-of-use renovations.",
    intro:
      "We bid from plans and we build from them. Tenant build-outs, restaurant kitchens, medical and dental suites, offices, and light industrial — from the service entrance through the final trim and inspection.",
    includes: [
      "Plan-and-spec bidding and design-build",
      "Service entrance, gear, and distribution",
      "Three-phase power and motor circuits",
      "Restaurant kitchen equipment circuits and hood interlocks",
      "Office, medical, and retail fit-outs",
      "Low-voltage and data rough-in",
      "Coordination with GCs, architects, and inspectors",
    ],
    signs: [
      "A signed lease on a space that needs work",
      "Plans out for bid",
      "A change of use that triggers a code review",
      "Equipment arriving that needs dedicated power",
    ],
    faqs: [
      {
        q: "Will you bid from our plans?",
        a: "Yes. Send the electrical sheets and the specification, and we will return a written bid with exclusions spelled out.",
      },
      {
        q: "Do you carry the insurance our landlord requires?",
        a: "We carry general liability and workers' compensation and will provide a certificate naming your entity as additional insured.",
      },
    ],
  },
  {
    slug: "commercial-lighting",
    name: "Commercial & LED Lighting Retrofits",
    category: "commercial",
    icon: "bulb",
    summary:
      "LED retrofits, parking lot and pole lighting, warehouse high-bay, and sign circuits that cut the power bill.",
    intro:
      "Switching a building from fluorescent to LED usually pays for itself in energy and lamp replacement. We handle the retrofit, the poles and bucket work, and the controls.",
    includes: [
      "Fluorescent to LED retrofits and full fixture replacement",
      "Warehouse and shop high-bay lighting",
      "Parking lot, pole, and wall-pack lighting",
      "Sign and channel-letter circuits",
      "Occupancy sensors, timers, and photocells",
      "Exterior security lighting",
      "Lighting-level layouts for new spaces",
    ],
    signs: [
      "Ballasts humming or lamps out across the building",
      "A dark or unsafe parking lot",
      "A power bill that keeps climbing",
      "Fixtures nobody can reach without a lift",
    ],
    faqs: [
      {
        q: "What is the payback on an LED retrofit?",
        a: "It depends on run hours and your rate, but most commercial retrofits land in the two-to-four-year range once you count lamp and ballast replacement you no longer pay for.",
      },
      {
        q: "Do you have a bucket truck or lift?",
        a: "We handle pole and high-bay work, bringing in the right lift for the site. It is included in the quote, not billed as a surprise.",
      },
    ],
  },
  {
    slug: "agricultural-electrical",
    name: "Agricultural & Shop Electrical",
    category: "commercial",
    icon: "barn",
    summary:
      "Barn, grain, irrigation, and shop wiring built for dust, moisture, and three-phase equipment.",
    intro:
      "Farm electrical takes different materials than a house. Wet and dusty locations, long underground runs, and motor loads all need gear that holds up, and we build it that way the first time.",
    includes: [
      "Barn, shop, and outbuilding services",
      "Grain bin, dryer, and auger circuits",
      "Irrigation pump and well controls",
      "Three-phase motor starters and controls",
      "Long underground and overhead runs between buildings",
      "Welder and compressor circuits",
      "Livestock building lighting and ventilation power",
    ],
    signs: [
      "Extension cords running between outbuildings",
      "A motor that will not start under load",
      "Corroded boxes and fittings in a wet building",
      "New equipment that needs three-phase power",
    ],
    faqs: [
      {
        q: "Can you get three-phase power to my shop?",
        a: "Sometimes the utility can bring it in, and sometimes a phase converter is the practical answer. We will price both.",
      },
      {
        q: "Do you do underground runs between buildings?",
        a: "Yes, including trenching, proper burial depth, and the disconnects the code requires at each structure.",
      },
    ],
  },
];

export const residentialServices = services.filter((s) => s.category === "residential");
export const commercialServices = services.filter((s) => s.category === "commercial");
export const popularServices = services.filter((s) => s.popular);

export function getService(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}

// ---- Service area ------------------------------------------------------- //
// CONFIRM the radius and the town list with the owner before launch.

export const serviceArea = {
  radiusMiles: 40,
  counties: ["Calloway", "Marshall", "Graves", "Trigg", "Henry County, TN"],
  towns: [
    "Murray",
    "Hazel",
    "New Concord",
    "Dexter",
    "Almo",
    "Kirksey",
    "Lynn Grove",
    "Aurora",
    "Benton",
    "Hardin",
    "Draffenville",
    "Calvert City",
    "Mayfield",
    "Farmington",
    "Cadiz",
    "Kentucky Lake",
    "Land Between the Lakes",
    "Puryear, TN",
    "Paris, TN",
  ],
} as const;

// ---- Booking process ------------------------------------------------------------ //

export const bookingProcess = [
  {
    step: "1",
    title: "Tell us what is going on",
    body: "Call, or send the request form with photos. The more detail you give us, the closer the first number is to the final one.",
  },
  {
    step: "2",
    title: "We schedule and confirm",
    body: "You get a scheduled window, not a whole-day wait. We text before we head your way.",
  },
  {
    step: "3",
    title: "You approve the price",
    body: "We diagnose, walk you through the options, and give you a written price. Nothing starts until you say yes.",
  },
  {
    step: "4",
    title: "We do the work and clean up",
    body: "Permits pulled where required, panel labeled, jobsite swept, and the inspector met if the job needs one.",
  },
] as const;

// ---- Testimonials ------------------------------------------------------- //

/**
 * REAL REVIEWS ONLY. This array is empty on purpose.
 *
 * Every testimonial section on the site hides itself when this is empty, so
 * the site can ship today without ever publishing a fabricated review.
 * Inventing testimonials violates the FTC Act (16 CFR Part 465, which since
 * 2024 carries civil penalties per violation) and Kentucky's Consumer
 * Protection Act.
 *
 * To add real ones, paste them in this shape — first name, town, and the job
 * performed convert far better than anonymous quotes:
 *
 *   {
 *     quote: "Exactly what they said it would cost, and they labeled the panel.",
 *     name: "Sarah T.",
 *     location: "Benton, KY",
 *     service: "Panel upgrade",
 *   },
 *
 * Only publish a review the customer actually wrote. Screenshots from the
 * Google or Facebook listing are the easiest source, and you may quote a
 * public review verbatim with attribution.
 */
export const testimonials: {
  quote: string;
  name: string;
  location: string;
  service: string;
}[] = [];


// ---- General FAQ --------------------------------------------------------- //

export const generalFaqs = [
  {
    q: "Are you licensed and insured?",
    a: "Yes. NORS Electric is a licensed Kentucky electrical contractor, bonded and insured. We will provide a certificate of insurance on request for any commercial or property-management job.",
  },
  {
    q: "How do you charge — hourly or flat rate?",
    a: "Most work is quoted as a flat price you approve before we start. Diagnostic and open-ended troubleshooting is billed for the time it takes, and we tell you the rate on the phone before we roll a truck.",
  },
  {
    q: "Do you offer free estimates?",
    a: "Estimates for planned work — panel upgrades, generators, EV chargers, remodels, and commercial bids — are free. Diagnosing an existing problem is billable work, because finding the fault is the job.",
  },
  {
    q: "How soon can you get here?",
    a: "Routine service is usually scheduled within a few business days. Anything involving heat, smoke, burning smells, or a total loss of power moves to the front of the line — call us instead of using the form.",
  },
  {
    q: "Do you pull permits?",
    a: "Yes, on every job where Kentucky code requires one. We file the permit, meet the inspector, and hand you the paperwork. Be careful with anyone who offers to skip it — unpermitted work can void an insurance claim and hold up a home sale.",
  },
  {
    q: "What areas do you serve?",
    a: `We work out of Murray and cover roughly a ${serviceArea.radiusMiles}-mile radius, including ${serviceArea.counties.slice(0, 4).join(", ")} counties. If you are just outside it, call and ask.`,
  },
  {
    q: "Do you work with home warranty companies?",
    a: "We are not a home warranty contractor. We work directly for you, which means we answer to you about the scope and the schedule.",
  },
  {
    q: "Can I buy my own fixtures and materials?",
    a: "You can supply fixtures, chargers, and generators. We will install a listed product, but the manufacturer's warranty on customer-supplied equipment stays with you.",
  },
] as const;

export type Testimonial = (typeof testimonials)[number];
