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
  "Teas, spice and herb blends",
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
  "Labels for teas, spice and herb blends",
] as const;

export const WAITLIST_MAX_WANTS = 3;

/** Fewer seconds than this between page load and submit looks like a bot. */
export const WAITLIST_MIN_SECONDS = 3;

export type WaitlistEntry = {
  first_name: string;
  last_name: string;
  email: string;
  makes: string[];
  makes_other: string | null;
  product_count: string;
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

  const first = cleanName(list(input.first_name)[0]);
  const last = cleanName(list(input.last_name)[0]);
  if (!first || !last) return { ok: false, bot: false, error: "Please enter your first and last name." };

  const email = (list(input.email)[0] ?? "").toLowerCase();
  if (!email || email.length > 254 || !EMAIL.test(email)) {
    return { ok: false, bot: false, error: "Please enter a valid email address." };
  }

  const makes = pick(input.makes, WAITLIST_MAKES);
  const other = cleanName(list(input.makes_other)[0], 100) || null;
  if (makes.includes("Something else") && !other) {
    return { ok: false, bot: false, error: "Please tell us what else you make." };
  }

  const count = list(input.product_count)[0];
  const countOk = !!count && (WAITLIST_COUNTS as readonly string[]).includes(count);
  const sells = pick(input.sells, WAITLIST_SELLS);
  const wants = pick(input.wants, WAITLIST_WANTS, WAITLIST_MAX_WANTS);
  // Every question is required (Leslie, Nov 7). "What matters most": at least 1, up to 3.
  if (!makes.length) return { ok: false, bot: false, error: "Please tell us what you make." };
  if (!countOk) return { ok: false, bot: false, error: "Please choose how many products you make." };
  if (!sells.length) return { ok: false, bot: false, error: "Please tell us where you sell." };
  if (!wants.length) return { ok: false, bot: false, error: "Please pick what matters most to you (up to 3)." };
  const source = (list(input.source)[0] ?? "").slice(0, 100) || null;
  return {
    ok: true,
    entry: {
      first_name: first,
      last_name: last,
      email,
      makes,
      makes_other: makes.includes("Something else") ? other : null,
      product_count: count!,
      sells,
      wants,
      source,
    },
  };
}

/** A name as typed, minus control characters and extra spaces, at most 60 characters. */
function cleanName(v: string | undefined, max = 60): string {
  return (v ?? "").replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, max);
}

/** Common misspellings of big email providers. The form offers "Did you mean ...?" for these. */
export const EMAIL_TYPOS: Record<string, string> = {
  "gmial.com": "gmail.com", "gmai.com": "gmail.com", "gmal.com": "gmail.com", "gamil.com": "gmail.com",
  "gnail.com": "gmail.com", "gmail.co": "gmail.com", "gmail.con": "gmail.com", "gmail.cm": "gmail.com",
  "gmaill.com": "gmail.com", "yaho.com": "yahoo.com", "yahooo.com": "yahoo.com", "yahoo.co": "yahoo.com",
  "yahoo.con": "yahoo.com", "hotmial.com": "hotmail.com", "hotmal.com": "hotmail.com", "hotmail.co": "hotmail.com",
  "hotmail.con": "hotmail.com", "outlok.com": "outlook.com", "outloo.com": "outlook.com", "outlook.co": "outlook.com",
  "outlook.con": "outlook.com", "icloud.co": "icloud.com", "icoud.com": "icloud.com", "iclod.com": "icloud.com",
  "aol.co": "aol.com", "aol.con": "aol.com", "comcast.ner": "comcast.net", "sbcglobal.ner": "sbcglobal.net",
};

/** "Did you mean ...?" for a misspelled big provider, or null. */
export function emailTypo(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at < 1) return null;
  const fix = EMAIL_TYPOS[email.slice(at + 1).toLowerCase()];
  return fix ? `${email.slice(0, at)}@${fix}` : null;
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
