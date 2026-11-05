import type { RecipeLine } from "./core/types";

/**
 * Plans (Master Plan, Oct 23). Free does the whole label job for one product: every
 * feature, one product (a variation counts as a product) and up to 3 logged batches.
 * The database enforces the counts too (migration 0014).
 */
export type Plan = "free" | "pro" | "enterprise";
export const FREE_LIMITS = { products: 1, batches: 3 } as const;

/** Three-strikes rule: after 3 strikes the next big swap gets a nudge; the one after locks. */
export const STRIKES_BEFORE_NUDGE = 3;

/** What a Free product is, for telling whether a save turned it into a different product. */
export interface ProductPrint {
  name: string;
  /** Scent ingredients (essential oils, fragrance, botanicals), as typed, lower case. */
  scent: string[];
  /** Every recipe line's ingredient, as typed, lower case. */
  lines: string[];
}

const SCENT = /(essential oil|\beo\b|fragrance|parfum|absolute|infused|herb|flower|leaf|root|petal|botanical|lavender|peppermint|mint|rose|chamomile|eucalyptus|tea tree|rosemary|lemon|orange|grapefruit|bergamot|vanilla|cedar|sandalwood|frankincense|patchouli|ylang|geranium|lemongrass|clary sage|calendula|mugwort|yarrow)/;
const clean = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

export function productPrint(name: string, recipe: RecipeLine[]): ProductPrint {
  const lines = recipe.map((l) => clean(l.text)).filter(Boolean);
  return { name: clean(name), scent: lines.filter((l) => SCENT.test(l)), lines };
}

/** Letters changed to get from a to b (small = a typo fix, not a new name). */
function editDistance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0]![j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i]![j] = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length]![b.length]!;
}

/**
 * A big swap: a new name plus a new scent (Lavender Body Butter becoming Peppermint Body
 * Butter), or 80% or more of the recipe's ingredients replaced. A typo fix or new amounts
 * are not. Starting rule from the Master Plan; tune it from what makers do.
 */
export function isBigSwap(before: ProductPrint, after: ProductPrint): boolean {
  const newName = editDistance(before.name, after.name) > Math.max(3, Math.floor(before.name.length * 0.25));
  const sameScent = new Set(before.scent);
  const newScent = after.scent.length > 0 && before.scent.length > 0 && after.scent.every((s) => !sameScent.has(s));
  const kept = new Set(before.lines);
  const replaced = after.lines.length ? after.lines.filter((l) => !kept.has(l)).length / after.lines.length : 0;
  return (newName && newScent) || (before.lines.length > 0 && replaced >= 0.8);
}

export const UPGRADE_NOTE = "Pro (unlimited products and batches) opens at launch.";
