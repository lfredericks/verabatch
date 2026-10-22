/**
 * Supplies: each delivery of an ingredient a maker receives, with the supplier's lot number.
 * Batches record which supply lot each recipe line used (table batch_supplies), so a
 * supplier recall can be traced both ways. Amounts aren't subtracted yet (later option).
 */

import type { MarketPack, NamePick } from "./core/types";

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
  /** What was paid for this lot, in dollars. */
  cost?: number | string | null;
  /** The maker's description, needed when the ingredient isn't recognized. */
  description?: string;
  /** Official ingredient name picked for it (or the maker's own). */
  name_pick?: NamePick | null;
  invoice_id?: string | null;
}

/** "$24.50" or "24.50" -> 24.5; "" -> null; NaN for nonsense. */
export function parseMoney(text: string): number | null {
  const t = text.replace(/[$,\s]/g, "");
  if (!t) return null;
  if (!/^\d+(\.\d{1,2})?$|^\.\d{1,2}$/.test(t)) return NaN;
  return Math.round(Number(t) * 100) / 100;
}

export function money(n: number | string | null | undefined): string {
  if (n === null || n === undefined || n === "") return "";
  return Number(n).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

/** "$12.25/lb" from cost and amount, when both are numbers. */
export function costPerUnit(s: Pick<Supply, "cost" | "amount" | "unit">): string {
  const cost = s.cost === null || s.cost === undefined || s.cost === "" ? NaN : Number(s.cost);
  const qty = Number(String(s.amount).replace(/[^\d.]/g, ""));
  if (!(cost >= 0) || !(qty > 0) || !s.unit) return "";
  const per = cost / qty;
  const u = s.unit === "floz" ? "fl oz" : s.unit === "l" ? "L" : s.unit === "ml" ? "mL" : s.unit === "each" ? "each" : s.unit;
  return `${per.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: per < 1 ? 3 : 2 })}/${u}`;
}

/**
 * Is this supply a known ingredient? "official" = a name was picked from the official list;
 * "recognized" = our ingredient list knows it; "unknown" = needs the maker's description.
 */
export function recognize(
  ingredient: string,
  pick: NamePick | null | undefined,
  pack: MarketPack,
): { status: "official" | "recognized" | "unknown"; name?: string } {
  if (pick?.kind === "official") return { status: "official", name: pick.name };
  if (!ingredient.trim()) return { status: "unknown" };
  const r = pack.resolve({ amount: "", unit: "g", text: ingredient });
  if (r.status === "known") return { status: "recognized", name: r.parts ? r.parts.map((p) => p.labelName).join(" + ") : r.labelName };
  if (r.status === "needsChoice") return { status: "recognized", name: undefined };
  return { status: "unknown" };
}

export function cleanPick(raw: unknown): NamePick | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const name = typeof o.name === "string" ? o.name.trim().slice(0, 160) : "";
  return name && (o.kind === "official" || o.kind === "custom") ? { kind: o.kind, name } : null;
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
export function readSupplyForm(
  form: FormData,
  pack: MarketPack,
): { error: string } | { row: Omit<Supply, "id" | "used_up" | "invoice_id">; id: string } {
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
  const cost = parseMoney(get("cost", 20));
  if (cost !== null && Number.isNaN(cost)) return { error: "Enter the cost in dollars, like 24.50." };
  let pickRaw: unknown = null;
  try {
    pickRaw = JSON.parse(get("name_pick", 400) || "null");
  } catch {
    pickRaw = null;
  }
  const name_pick = cleanPick(pickRaw);
  const description = get("description", 500);
  if (recognize(ingredient, name_pick, pack).status === "unknown" && !description)
    return { error: `We don't recognize "${ingredient}". Pick its official name, or add a short description (what it is, plant part, form).` };
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
      cost,
      description,
      name_pick,
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
