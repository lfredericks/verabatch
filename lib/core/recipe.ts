import { convert, parseAmount } from "./units";
import type { MarketPack, RecipeLine, Resolution } from "./types";

export interface ComputedLine {
  line: RecipeLine;
  resolution: Resolution;
  grams: number;
  ml: number;
  approximate: boolean;
  /** Share of the batch by weight, 0–100. */
  pct: number;
}

export interface ComputedRecipe {
  lines: ComputedLine[];
  /** Lines skipped because the amount isn't a number or the text is blank. */
  skipped: RecipeLine[];
  totalGrams: number;
  totalMl: number;
  /** Lines still waiting for a variety, form or carrier choice. */
  needsChoice: ComputedLine[];
  /** Lines the pack doesn't recognise; shown as typed with a warning. */
  unknown: ComputedLine[];
  /** Lines using the maker's own name, not an official one. */
  custom: ComputedLine[];
  anyApproximate: boolean;
}

/** Density used when an ingredient is unknown or not yet resolved: water. */
const FALLBACK_DENSITY = 1;

export function computeRecipe(lines: RecipeLine[], pack: MarketPack): ComputedRecipe {
  const out: ComputedLine[] = [];
  const skipped: RecipeLine[] = [];
  for (const line of lines) {
    const amount = parseAmount(line.amount);
    if (!(amount > 0) || !line.text.trim()) {
      skipped.push(line);
      continue;
    }
    // A name the maker picked wins over the pack's own lookup.
    const resolution: Resolution = line.pick?.name.trim()
      ? {
          status: "known",
          labelName: line.pick.name.trim(),
          density: pack.guessDensity?.(line.pick.name) ?? FALLBACK_DENSITY,
          displayName: line.pick.name.trim(),
          pick: line.pick.kind,
        }
      : pack.resolve(line);
    const density = resolution.status === "known" ? resolution.density : FALLBACK_DENSITY;
    const c = convert(amount, line.unit, density);
    out.push({ line, resolution, grams: c.grams, ml: c.ml, approximate: c.approximate, pct: 0 });
  }
  const totalGrams = out.reduce((s, l) => s + l.grams, 0);
  const totalMl = out.reduce((s, l) => s + l.ml, 0);
  for (const l of out) l.pct = totalGrams > 0 ? (l.grams / totalGrams) * 100 : 0;
  return {
    lines: out,
    skipped,
    totalGrams,
    totalMl,
    needsChoice: out.filter((l) => l.resolution.status === "needsChoice"),
    unknown: out.filter((l) => l.resolution.status === "unknown"),
    custom: out.filter((l) => l.resolution.status === "known" && l.resolution.pick === "custom"),
    anyApproximate: out.some((l) => l.approximate),
  };
}

export interface LabelIngredient {
  /** Name on the label (INCI for cosmetics), or the text as typed if unknown. */
  name: string;
  grams: number;
  pct: number;
  /** Below the pack's minor threshold: may be listed in any order at the end. */
  minor: boolean;
  /** Not resolved yet; the label should not be printed until it is. */
  unresolved: boolean;
}

function titleCase(s: string): string {
  return s.trim().replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * The ingredient list in label order.
 * Spec: by weight, largest first. Ingredients under the pack's threshold (1% for
 * cosmetics) may follow in any order; v1 lists them by weight too.
 * The same label name used on two lines (e.g. white and natural beeswax) is listed once.
 */
export function labelIngredients(recipe: ComputedRecipe, pack: MarketPack): LabelIngredient[] {
  const merged = new Map<string, LabelIngredient>();
  const traces = new Set<string>();
  const add = (name: string, grams: number, pct: number, unresolved: boolean) => {
    const key = name.toLowerCase();
    const existing = merged.get(key);
    if (existing) {
      existing.grams += grams;
      existing.pct += pct;
      existing.unresolved ||= unresolved;
    } else {
      merged.set(key, { name, grams, pct, minor: false, unresolved });
    }
  };
  for (const l of recipe.lines) {
    const r = l.resolution;
    if (r.status === "known" && r.parts?.length) {
      // e.g. arnica infused in jojoba: the jojoba joins any other jojoba, the extract is a trace.
      for (const p of r.parts) {
        add(p.labelName, l.grams * p.share, l.pct * p.share, false);
        if (p.share === 0) traces.add(p.labelName.toLowerCase());
      }
      continue;
    }
    add(r.status === "known" ? r.labelName : titleCase(l.line.text), l.grams, l.pct, r.status !== "known");
  }
  const all = [...merged.values()];
  for (const i of all) i.minor = i.pct < pack.minorThresholdPct || (traces.has(i.name.toLowerCase()) && i.grams === 0);
  const byWeight = (a: LabelIngredient, b: LabelIngredient) => b.grams - a.grams;
  return [...all.filter((i) => !i.minor).sort(byWeight), ...all.filter((i) => i.minor).sort(byWeight)];
}
