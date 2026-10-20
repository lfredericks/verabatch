import type { RecipeLine } from "./core/types";
import { cleanRecipe } from "./products";

/** A batch as stored. The recipe is a frozen copy of what was actually used. */
export interface Batch {
  id: string;
  product_id: string;
  lot: string;
  made_on: string;
  changed: boolean;
  counts: Record<string, number>;
  recipe: RecipeLine[];
  note: string;
}

/** Key for the count when a product has no sizes. */
export const NO_SIZE = "_none";

export function cleanCounts(input: unknown, allowed: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  if (!input || typeof input !== "object") return out;
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    const n = Math.round(Number(v));
    if (allowed.includes(k) && n > 0 && n <= 100000) out[k] = n;
  }
  return out;
}

export function totalCount(counts: Record<string, number>): number {
  return Object.values(counts).reduce((s, n) => s + n, 0);
}

/** "5 × 2 oz jar, 3 × 4 oz jar" */
export function countsText(counts: Record<string, number>, sizeNames: Record<string, string>): string {
  const parts = Object.entries(counts).map(([k, n]) => (k === NO_SIZE ? `${n} made` : `${n} × ${sizeNames[k] ?? "removed size"}`));
  return parts.join(", ") || "No count";
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function readBatchForm(form: FormData, sizeIds: string[]) {
  const madeOn = String(form.get("made_on") ?? "").trim();
  const changed = form.get("changed") === "1";
  let recipe: unknown = [];
  let counts: unknown = {};
  try {
    recipe = JSON.parse(String(form.get("recipe") ?? "[]"));
    counts = JSON.parse(String(form.get("counts") ?? "{}"));
  } catch {
    /* fall through to empty */
  }
  const note = String(form.get("note") ?? "").trim().slice(0, 2000);
  const allowed = sizeIds.length ? sizeIds : [NO_SIZE];
  const out = {
    id: String(form.get("id") ?? ""),
    productId: String(form.get("product_id") ?? ""),
    madeOn,
    changed,
    recipe: cleanRecipe(recipe),
    counts: cleanCounts(counts, allowed),
    note,
  };
  let error: string | undefined;
  if (!DATE.test(madeOn) || Number.isNaN(Date.parse(madeOn))) error = "Pick the date you made it.";
  else if (changed && !out.recipe.length) error = "Add what went into this batch.";
  return { ...out, error };
}
