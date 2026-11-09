import { GRAMS_PER, ML_PER, parseAmount } from "./core";
import { matchScore, type Supply, type SupplyUnit } from "./supplies";

/**
 * Supplies, as makers see them (Leslie, Nov 8-9): a MATERIAL is whatever the maker calls it
 * ("Unrefined shea"), added once. Each row in `supplies` is one DELIVERY of a material, from any
 * shop. Amounts count down as batches use them, oldest delivery first, so on-hand totals stay
 * current on every plan. On screen: "My supplies" and "deliveries", never "materials" or "lots".
 */

export interface Material {
  id: string;
  name: string;
  blend: string;
  note: string;
}

export interface Delivery extends Supply {
  material_id: string | null;
  cost?: number | string | null;
  invoice_id?: string | null;
  organic?: boolean;
}

const WEIGHT: Partial<Record<SupplyUnit, number>> = { g: 1, kg: GRAMS_PER.kg, oz: GRAMS_PER.oz, lb: GRAMS_PER.lb };
const VOLUME: Partial<Record<SupplyUnit, number>> = { ml: 1, l: ML_PER.l, floz: ML_PER.floz, gal: 3785.41 };

/** A recipe line's amount (grams and mL) in a delivery's unit; null when it can't be counted. */
export function inSupplyUnit(line: { grams: number; ml: number }, unit: SupplyUnit): number | null {
  if (WEIGHT[unit]) return line.grams / WEIGHT[unit]!;
  if (VOLUME[unit]) return line.ml / VOLUME[unit]!;
  return null;
}

/** What's left of a delivery after the amounts batches used; null when no amount was logged. */
export function remaining(d: Pick<Supply, "amount" | "unit">, used: number[]): number | null {
  const got = parseAmount(d.amount);
  if (!(got > 0) || !d.unit) return null;
  const left = got - used.reduce((s, n) => s + n, 0);
  return left > 0 ? Math.round(left * 10000) / 10000 : 0;
}

/**
 * Share a line's amount across the deliveries it came from, oldest first: use up what's left of
 * the first, then the next. If they run out on paper, the last one takes the rest. If nothing is
 * known about what's left, split evenly.
 */
export function allocate(needed: number, from: { id: string; left: number | null }[]): { id: string; amount: number }[] {
  if (!from.length || !(needed > 0)) return [];
  if (from.every((f) => f.left === null)) return from.map((f) => ({ id: f.id, amount: needed / from.length }));
  const out: { id: string; amount: number }[] = [];
  let rest = needed;
  from.forEach((f, i) => {
    const last = i === from.length - 1;
    const take = last ? rest : Math.min(rest, Math.max(0, f.left ?? 0));
    if (take > 0) out.push({ id: f.id, amount: Math.round(take * 10000) / 10000 });
    rest -= take;
  });
  return out;
}

/** Everything on hand of one material in one unit (the first delivery's), or null if it can't be added up. */
export function onHand(list: { left: number | null; unit: SupplyUnit }[]): { amount: number; unit: SupplyUnit } | null {
  const known = list.filter((d) => d.left !== null && d.unit);
  if (!known.length || known.length < list.length) return null;
  const unit = known[0]!.unit;
  const table = WEIGHT[unit] ? WEIGHT : VOLUME[unit] ? VOLUME : null;
  if (!table) return known.every((d) => d.unit === unit) ? { amount: known.reduce((s, d) => s + d.left!, 0), unit } : null;
  let total = 0;
  for (const d of known) {
    if (!table[d.unit]) return null;
    total += (d.left! * table[d.unit]!) / table[unit]!;
  }
  return { amount: Math.round(total * 100) / 100, unit };
}

const UNIT_TEXT: Record<string, string> = { floz: "fl oz", ml: "mL", l: "L", each: "" };

/** "2.1 lb", "14 fl oz", "3" (each). */
export function amountShort(amount: number, unit: SupplyUnit): string {
  const n = amount >= 10 ? Math.round(amount * 10) / 10 : Math.round(amount * 100) / 100;
  const u = UNIT_TEXT[unit] ?? unit;
  return u ? `${n} ${u}` : String(n);
}

/**
 * Your supplies that a recipe line could be ("Which one of yours is it?"), best match first.
 * Words like oil and butter don't count, so "20 drops lavender" finds "Lavender essential oil".
 */
export function matchMaterials<T extends { id: string; name: string }>(lineText: string, materials: T[]): T[] {
  return materials
    .map((m) => ({ m, n: matchScore(lineText, m.name) }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .map((x) => x.m);
}
