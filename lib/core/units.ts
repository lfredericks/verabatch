import type { Unit, VolumeUnit, WeightUnit } from "./types";

/** Grams per unit. Spec: 1 oz = 28.3495 g, 1 lb = 453.592 g. */
export const GRAMS_PER: Record<WeightUnit, number> = {
  g: 1,
  kg: 1000,
  oz: 28.3495,
  lb: 453.592,
};

/** Millilitres per unit. Spec: tsp 4.92892, tbsp 14.7868, cup 236.588, fl oz 29.5735, drop 0.05. */
export const ML_PER: Record<VolumeUnit, number> = {
  ml: 1,
  l: 1000,
  tsp: 4.92892,
  tbsp: 14.7868,
  cup: 236.588,
  floz: 29.5735,
  drop: 0.05,
};

export const UNIT_LABELS: Record<Unit, string> = {
  g: "g",
  kg: "kg",
  oz: "oz",
  lb: "lb",
  ml: "mL",
  l: "L",
  tsp: "tsp",
  tbsp: "tbsp",
  cup: "cup",
  floz: "fl oz",
  drop: "drops",
};

export function isWeightUnit(unit: Unit): unit is WeightUnit {
  return unit in GRAMS_PER;
}

/** Words makers type for units, mapped to our unit keys. */
export const UNIT_ALIASES: Record<string, Unit> = {
  g: "g", gram: "g", grams: "g", gr: "g",
  kg: "kg", kilo: "kg", kilos: "kg", kilogram: "kg", kilograms: "kg",
  oz: "oz", ounce: "oz", ounces: "oz",
  lb: "lb", lbs: "lb", pound: "lb", pounds: "lb",
  ml: "ml", mls: "ml", milliliter: "ml", milliliters: "ml", millilitre: "ml", millilitres: "ml",
  l: "l", liter: "l", liters: "l", litre: "l", litres: "l",
  tsp: "tsp", teaspoon: "tsp", teaspoons: "tsp", tsps: "tsp",
  tbsp: "tbsp", tbs: "tbsp", tablespoon: "tbsp", tablespoons: "tbsp", tbsps: "tbsp",
  cup: "cup", cups: "cup", c: "cup",
  floz: "floz", "fl oz": "floz", "fluid ounce": "floz", "fluid ounces": "floz",
  drop: "drop", drops: "drop", gtt: "drop", gtts: "drop",
};

/**
 * Parse an amount as typed: "12", "0.5", ".5", "1/2", "1 1/2".
 * Returns NaN when it isn't a number.
 */
export function parseAmount(text: string): number {
  const t = text.trim();
  let m = t.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (m) return Number(m[1]) + Number(m[2]) / Number(m[3]);
  m = t.match(/^(\d+)\/(\d+)$/);
  if (m) return Number(m[1]) / Number(m[2]);
  if (/^(\d+\.?\d*|\.\d+)$/.test(t)) return Number(t);
  return Number.NaN;
}

export interface Converted {
  grams: number;
  ml: number;
  /** True when a volume was turned into weight with a typical density. */
  approximate: boolean;
}

/**
 * Convert an amount in any unit to grams and millilitres.
 * Spec: volume to weight = mL × density, and such results are marked approximate.
 */
export function convert(amount: number, unit: Unit, density: number): Converted {
  if (isWeightUnit(unit)) {
    const grams = amount * GRAMS_PER[unit];
    return { grams, ml: grams / density, approximate: false };
  }
  const ml = amount * ML_PER[unit];
  return { grams: ml * density, ml, approximate: true };
}
