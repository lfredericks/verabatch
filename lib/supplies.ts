/**
 * Supplies: each delivery of an ingredient a maker receives, with the supplier's lot number.
 * Batches record which supply lot each recipe line used (table batch_supplies), so a
 * supplier recall can be traced both ways. Amounts aren't subtracted yet (later option).
 */

export interface Supply {
  id: string;
  ingredient: string;
  supplier: string;
  supplier_lot: string;
  amount: string;
  unit: SupplyUnit;
  received_on: string | null;
  best_by: string | null;
  note: string;
  used_up: boolean;
}

export type SupplyUnit = "" | "oz" | "lb" | "g" | "kg" | "floz" | "ml" | "l" | "gal" | "each";

export const SUPPLY_UNITS: { key: SupplyUnit; label: string }[] = [
  { key: "lb", label: "lb" },
  { key: "oz", label: "oz (weight)" },
  { key: "kg", label: "kg" },
  { key: "g", label: "g" },
  { key: "gal", label: "gallon" },
  { key: "l", label: "L" },
  { key: "floz", label: "fl oz (liquid)" },
  { key: "ml", label: "mL" },
  { key: "each", label: "each" },
];

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const okDate = (s: string) => DATE.test(s) && !Number.isNaN(Date.parse(s));

/** Check and tidy a supply from a form. Returns an error or the row to save. */
export function readSupplyForm(form: FormData): { error: string } | { row: Omit<Supply, "id" | "used_up">; id: string } {
  const get = (k: string, max: number) => String(form.get(k) ?? "").trim().slice(0, max);
  const ingredient = get("ingredient", 200);
  const unitRaw = get("unit", 10);
  const received = get("received_on", 10);
  const bestBy = get("best_by", 10);
  if (!ingredient) return { error: "Say what the ingredient is, like Chamomile flower." };
  if (ingredient.length > 120) return { error: "Keep the ingredient name under 120 characters." };
  if (received && !okDate(received)) return { error: "Pick the date you received it." };
  if (bestBy && !okDate(bestBy)) return { error: "Pick a best-by date, or leave it empty." };
  const amount = get("amount", 20);
  return {
    id: get("id", 40),
    row: {
      ingredient,
      supplier: get("supplier", 120),
      supplier_lot: get("supplier_lot", 60),
      amount,
      unit: SUPPLY_UNITS.some((u) => u.key === unitRaw) && amount ? (unitRaw as SupplyUnit) : "",
      received_on: received || null,
      best_by: bestBy || null,
      note: get("note", 2000),
    },
  };
}

/** "Chamomile flower · Mountain Rose Herbs · lot XXXX-XXXX" */
export function supplyText(s: Pick<Supply, "ingredient" | "supplier" | "supplier_lot">): string {
  return [s.ingredient, s.supplier, s.supplier_lot ? `lot ${s.supplier_lot}` : ""].filter(Boolean).join(" · ");
}

export function amountText(s: Pick<Supply, "amount" | "unit">): string {
  if (!s.amount) return "";
  const u = SUPPLY_UNITS.find((x) => x.key === s.unit);
  return `${s.amount}${u ? ` ${u.key === "floz" ? "fl oz" : u.key === "l" ? "L" : u.key === "ml" ? "mL" : u.key}` : ""}`;
}

/** Words that don't tell ingredients apart. */
const GENERIC = new Set([
  "oil", "oils", "essential", "butter", "extract", "organic", "dried", "dry", "flower", "flowers", "leaf", "leaves",
  "powder", "root", "seed", "cold", "pressed", "refined", "unrefined", "raw", "pure", "natural", "wild", "fresh",
  "whole", "cut", "sifted", "infused", "with", "and", "the", "of", "in", "from", "virgin", "extra", "liquid", "certified",
]);

function words(t: string): string[] {
  return t
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/s$/, ""))
    .filter((w) => w.length >= 3 && !GENERIC.has(w) && !GENERIC.has(`${w}s`));
}

/** How well a supply matches a recipe line's ingredient text: 0 = not at all. */
export function matchScore(lineText: string, supplyIngredient: string): number {
  const a = words(lineText);
  const b = new Set(words(supplyIngredient));
  return a.filter((w) => b.has(w)).length;
}

/**
 * Supplies to offer for one recipe line: matches first (best match, then newest), then
 * everything else still open. Used-up lots are only kept if already picked.
 */
export function suppliesForLine<T extends Supply>(lineText: string, supplies: T[], picked?: string): { matches: T[]; others: T[] } {
  const open = supplies.filter((s) => !s.used_up || s.id === picked);
  const newest = (x: T, y: T) => (y.received_on ?? "").localeCompare(x.received_on ?? "");
  const scored = open.map((s) => ({ s, n: matchScore(lineText, s.ingredient) }));
  const matches = scored
    .filter((x) => x.n > 0)
    .sort((x, y) => y.n - x.n || newest(x.s, y.s))
    .map((x) => x.s);
  const others = scored
    .filter((x) => x.n === 0)
    .map((x) => x.s)
    .sort(newest);
  return { matches, others };
}

const UUID = /^[0-9a-f-]{36}$/i;

/** Up to this many supply lots per recipe line (an infused oil uses the herb and the oil). */
export const MAX_LOTS_PER_LINE = 5;

/** Line index → supply ids from the batch form, checked against the business's supplies. */
export function cleanSupplyPicks(raw: unknown, lineCount: number, known: Set<string>): Map<number, string[]> {
  const out = new Map<number, string[]>();
  if (!raw || typeof raw !== "object") return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const i = Number(k);
    const ids = (Array.isArray(v) ? v : [v]).filter((x): x is string => typeof x === "string" && UUID.test(x) && known.has(x));
    const unique = [...new Set(ids)].slice(0, MAX_LOTS_PER_LINE);
    if (Number.isInteger(i) && i >= 0 && i < lineCount && unique.length) out.set(i, unique);
  }
  return out;
}

/**
 * Lots to start a new batch's line with: the newest lot on hand of each matching ingredient,
 * so "chamomile infused jojoba oil" starts with the newest chamomile and the newest jojoba.
 */
export function defaultLots(lineText: string, supplies: Supply[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const best = suppliesForLine(lineText, supplies).matches;
  const top = best.length ? matchScore(lineText, best[0]!.ingredient) : 0;
  for (const s of best) {
    const kind = s.ingredient.trim().toLowerCase();
    if (seen.has(kind) || matchScore(lineText, s.ingredient) < top) continue;
    seen.add(kind);
    out.push(s.id);
  }
  return out.slice(0, MAX_LOTS_PER_LINE);
}
