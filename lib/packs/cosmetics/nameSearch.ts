import { readFileSync } from "node:fs";
import { join } from "node:path";
import { COMMON_TO_LATIN } from "./aliases";

/** Server only: suggestions from the official ingredient name list (data/cosing-inci-names.txt). */

let NAMES: string[] | null = null;
function names(): string[] {
  if (!NAMES) {
    NAMES = readFileSync(join(process.cwd(), "data/cosing-inci-names.txt"), "utf8")
      .split("\n")
      .filter((l) => l && !l.startsWith("#"));
  }
  return NAMES;
}

/** "ARTEMISIA VULGARIS EXTRACT" -> "Artemisia Vulgaris Extract" */
export function titleCaseInci(n: string): string {
  return n.toLowerCase().replace(/(^|[\s/(-])([a-z])/g, (_m, a: string, b: string) => a + b.toUpperCase());
}

/** Words that say which form the maker means, not which plant. */
const FORM_WORDS: Record<string, string> = {
  oil: "OIL", eo: "OIL", essential: "OIL", infused: "EXTRACT", extract: "EXTRACT", tincture: "EXTRACT",
  water: "WATER", hydrosol: "WATER", butter: "BUTTER", wax: "WAX", powder: "POWDER", dried: "",
  flower: "FLOWER", flowers: "FLOWER", leaf: "LEAF", leaves: "LEAF", root: "ROOT", seed: "SEED", bark: "BARK", herb: "HERB",
};

const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();

/**
 * Up to `limit` official names for what the maker typed. Common plant names are turned into
 * Latin names first ("mugwort" -> Artemisia vulgaris). Form words (oil, infused, water) rank
 * matching names higher instead of being required.
 */
export function suggestNames(typed: string, limit = 8): string[] {
  const q = clean(typed).replace(/\b\d+\s*(drops?|oz|g|ml|cups?|tbsp|tsp)\b/g, " ").trim();
  if (q.length < 2) return [];
  const words = q.split(" ");
  const wantForms = new Set(words.map((w) => FORM_WORDS[w]).filter(Boolean) as string[]);
  const plainWords = words.filter((w) => !(w in FORM_WORDS));
  const plain = plainWords.join(" ");

  // Latin names to look for: from the alias table (longest common name inside the text), or the words as typed.
  let latin: string[] = [];
  const hit = Object.keys(COMMON_TO_LATIN)
    .filter((k) => ` ${plain} `.includes(` ${k} `))
    .sort((a, b) => b.length - a.length)[0];
  if (hit) latin = COMMON_TO_LATIN[hit]!;
  const groups = latin.length ? latin.map((l) => l.toUpperCase().split(" ")) : [plainWords.map((w) => w.toUpperCase())];
  if (!groups[0]?.length) return [];

  const scored: { n: string; s: number }[] = [];
  for (const n of names()) {
    const parts = n.split(/[\s/()-]+/);
    for (const g of groups) {
      if (!g.every((w) => parts.includes(w) || (w.length > 4 && parts.some((p) => p.startsWith(w))))) continue;
      let s = 100 - n.length / 4; // shorter, simpler names first
      if (n.includes("/")) s -= 30; // blends of several plants last
      if (n.startsWith(g.join(" "))) s += 20;
      for (const f of wantForms) if (n.endsWith(f) || n.includes(` ${f} `)) s += 25;
      scored.push({ n, s });
      break;
    }
  }
  // Long blends of many plants ("A/B/C/... Extract") are noise unless nothing simpler exists.
  const simple = scored.filter((x) => !x.n.includes("/") && x.n.length <= 70);
  return (simple.length ? simple : scored.filter((x) => x.n.length <= 90))
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => titleCaseInci(x.n));
}
