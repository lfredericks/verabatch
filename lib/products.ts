import { UNIT_LABELS } from "./core/units";
import type { RecipeLine, Unit, VarietyChoice } from "./core/types";

/** A product as stored. The recipe is the master recipe, exactly as typed. */
export interface Product {
  id: string;
  name: string;
  type_key: string;
  identity: string;
  makes: number | null;
  recipe: RecipeLine[];
  /** Set for a variation: the product it is based on. */
  parent_id?: string | null;
  /** A variation's differences from its parent (see lib/variations.ts). */
  changes?: unknown;
  updated_at?: string;
}

const UNITS = Object.keys(UNIT_LABELS) as Unit[];
const MAX_LINES = 200;

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

function cleanVariety(v: unknown): VarietyChoice | undefined {
  if (!v || typeof v !== "object") return undefined;
  const o = v as Record<string, unknown>;
  const group = str(o.group, 40);
  if (!group) return undefined;
  const out: VarietyChoice = { group };
  for (const k of ["variety", "form", "carrier"] as const) {
    const s = str(o[k], 40);
    if (s) out[k] = s;
  }
  return out;
}

/** One recipe line, tidied; null if it's blank or not a line at all. */
export function cleanLine(raw: unknown): RecipeLine | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const text = str(o.text, 160).trim();
  const amount = str(o.amount, 20).trim();
  if (!text && !amount) return null;
  const unit = UNITS.includes(o.unit as Unit) ? (o.unit as Unit) : "g";
  const variety = cleanVariety(o.variety);
  const key = typeof o.key === "string" && /^[a-z0-9]{1,12}$/.test(o.key) ? o.key : undefined;
  return { amount, unit, text, ...(variety ? { variety } : {}), ...(key ? { key } : {}) };
}

/**
 * Turns whatever the browser sent into safe recipe lines. Amounts and text are kept
 * as typed (trimmed and length-capped); blank lines are dropped.
 */
export function cleanRecipe(input: unknown): RecipeLine[] {
  if (!Array.isArray(input)) return [];
  const out: RecipeLine[] = [];
  for (const raw of input.slice(0, MAX_LINES)) {
    const l = cleanLine(raw);
    if (l) out.push(l);
  }
  return out;
}
