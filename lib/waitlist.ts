/**
 * The waitlist form (verabatch.com, WordPress) and what the app accepts from it.
 * The form's choices must match these lists exactly; anything else is dropped.
 * Form code for WordPress: docs/waitlist-form.html.
 */

export const WAITLIST_MAKES = [
  "Soap",
  "Balms, butters and body oils",
  "Lotions and creams",
  "Herbal products",
  "Candles and wax melts",
  "Room sprays and home fragrance",
  "Teas and spice blends",
  "Potpourri, sachets and incense blends",
  "Something else",
] as const;

export const WAITLIST_COUNTS = ["Just starting", "1-5", "6-15", "16-40", "More than 40"] as const;

export const WAITLIST_SELLS = [
  "Etsy",
  "My own website",
  "Markets and craft fairs",
  "Shops and wholesale",
  "Friends and family",
  "Not selling yet",
] as const;

// "What matters most to you?" pick 3 of 10 (Leslie, Nov 6).
export const WAITLIST_WANTS = [
  "Knowing what each product costs me",
  "Labels that follow the rules",
  "Batch records and lot numbers",
  "Tracing supplies if there's a recall",
  "Tracking my stock and supplies",
  "Notes on my recipe tests",
  "Product sheets for wholesale",
  "Using it on my phone in the workshop",
  "Connecting to Etsy or Shopify",
  "Labels for teas and spice blends",
] as const;

export const WAITLIST_MAX_WANTS = 3;

/** Fewer seconds than this between page load and submit looks like a bot. */
export const WAITLIST_MIN_SECONDS = 3;

export type WaitlistEntry = {
  email: string;
  makes: string[];
  product_count: string | null;
  sells: string[];
  wants: string[];
  source: string | null;
};

export type WaitlistInput = Record<string, string | string[] | undefined>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function list(v: string | string[] | undefined): string[] {
  if (v === undefined) return [];
  return (Array.isArray(v) ? v : [v]).map((s) => s.trim()).filter(Boolean);
}

function pick(v: string | string[] | undefined, allowed: readonly string[], max = allowed.length): string[] {
  return [...new Set(list(v).filter((s) => allowed.includes(s)))].slice(0, max);
}

/**
 * Checks a submitted form. Returns the clean entry, "bot" for spam signs (the caller
 * pretends it worked), or an error message for the person.
 */
export function cleanWaitlist(
  input: WaitlistInput,
  nowMs: number = Date.now(),
): { ok: true; entry: WaitlistEntry } | { ok: false; bot: true } | { ok: false; bot: false; error: string } {
  // Honeypot: a hidden "website" field people never see or fill.
  if (list(input.website).length) return { ok: false, bot: true };
  const started = Number(list(input.started)[0]);
  if (Number.isFinite(started) && started > 0 && nowMs - started < WAITLIST_MIN_SECONDS * 1000) {
    return { ok: false, bot: true };
  }

  const email = (list(input.email)[0] ?? "").toLowerCase();
  if (!email || email.length > 254 || !EMAIL.test(email)) {
    return { ok: false, bot: false, error: "Please enter a valid email address." };
  }

  const count = list(input.product_count)[0];
  const source = (list(input.source)[0] ?? "").slice(0, 100) || null;
  return {
    ok: true,
    entry: {
      email,
      makes: pick(input.makes, WAITLIST_MAKES),
      product_count: count && (WAITLIST_COUNTS as readonly string[]).includes(count) ? count : null,
      sells: pick(input.sells, WAITLIST_SELLS),
      wants: pick(input.wants, WAITLIST_WANTS, WAITLIST_MAX_WANTS),
      source,
    },
  };
}

/** Where a plain (no-JavaScript) form submit may be sent back to. */
export function safeReturnUrl(v: string | undefined, fallback: string): string {
  if (!v) return fallback;
  try {
    const u = new URL(v);
    const ok = u.protocol === "https:" && (u.hostname === "verabatch.com" || u.hostname === "www.verabatch.com");
    return ok ? u.toString() : fallback;
  } catch {
    return fallback;
  }
}

export const WAITLIST_ORIGINS: [string, ...string[]] = ["https://verabatch.com", "https://www.verabatch.com"];
