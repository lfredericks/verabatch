import { GRAMS_PER, ML_PER } from "./units";
import type { DeclareBy } from "./types";

/** Round down to a number of decimal places, ignoring floating-point dust. */
export function floorTo(value: number, places: number): number {
  const f = 10 ** places;
  return Math.floor(value * f + 1e-9) / f;
}

function trimNumber(n: number): string {
  return String(Number(n.toFixed(2)));
}

export type FillUnit = "oz" | "floz" | "g" | "ml";

/**
 * Net contents for a size, from its fill amount.
 * Spec: rounded down, with the metric amount in brackets.
 *   4 oz      -> "Net Wt. 4 oz (113 g)"
 *   8 fl oz   -> "8 fl oz (236 mL)"
 */
export function netContentsForSize(fill: number, unit: FillUnit): string {
  if (unit === "oz" || unit === "g") {
    const grams = unit === "oz" ? fill * GRAMS_PER.oz : fill;
    const oz = floorTo(grams / GRAMS_PER.oz, 2);
    return `Net Wt. ${trimNumber(oz)} oz (${Math.floor(grams + 1e-9)} g)`;
  }
  const ml = unit === "floz" ? fill * ML_PER.floz : fill;
  const floz = floorTo(ml / ML_PER.floz, 2);
  return `${trimNumber(floz)} fl oz (${Math.floor(ml + 1e-9)} mL)`;
}

/**
 * Net contents when a product has no sizes: the batch divided by units made.
 * Spec: rounded down to 0.1 oz and to the whole gram.
 *   470 g batch, makes 4 -> "Net Wt. 4.1 oz (117 g)"
 */
export function netContentsFromBatch(
  totalGrams: number,
  totalMl: number,
  units: number,
  declareBy: DeclareBy,
): string {
  if (!(units > 0)) throw new Error("units must be greater than zero");
  if (declareBy === "weight") {
    const perG = totalGrams / units;
    const oz = floorTo(perG / GRAMS_PER.oz, 1);
    return `Net Wt. ${oz.toFixed(1)} oz (${Math.floor(perG + 1e-9)} g)`;
  }
  const perMl = totalMl / units;
  const floz = floorTo(perMl / ML_PER.floz, 1);
  return `${floz.toFixed(1)} fl oz (${Math.floor(perMl + 1e-9)} mL)`;
}
