import type { MarketPack, ProductWarnings } from "./core/types";

export const MAX_CUSTOM_WARNINGS = 5;
export const MAX_WARNING_LENGTH = 200;

/** Server-side check of the warnings the browser sends, or that come from the database. */
export function cleanWarnings(raw: unknown, pack: MarketPack): ProductWarnings {
  const known = new Set((pack.warnings ?? []).map((w) => w.key));
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const keys = Array.isArray(obj.keys) ? obj.keys.filter((k): k is string => typeof k === "string" && known.has(k)) : [];
  const custom = Array.isArray(obj.custom)
    ? obj.custom
        .filter((c): c is string => typeof c === "string")
        .map((c) => c.replace(/\s+/g, " ").trim().slice(0, MAX_WARNING_LENGTH))
        .filter(Boolean)
        .slice(0, MAX_CUSTOM_WARNINGS)
    : [];
  return { keys: [...new Set(keys)], custom };
}

/** End a statement with a period if it has no ending punctuation. */
function sentence(t: string): string {
  return /[.!?]$/.test(t) ? t : `${t}.`;
}

/**
 * The warning paragraphs for the back label, in the pack's order: required FDA wording first,
 * each on its own, then every other caution together after "Caution:".
 */
export function warningLines(w: ProductWarnings | null | undefined, pack: MarketPack): string[] {
  if (!w) return [];
  const chosen = new Set(w.keys);
  const options = (pack.warnings ?? []).filter((o) => chosen.has(o.key));
  const required = options.filter((o) => o.required).map((o) => o.text);
  // "Keep out of reach of children" once, even if a required warning already says it.
  const said = required.join(" ").toLowerCase();
  const rest = [
    ...options.filter((o) => !o.required).map((o) => (o.ifCovered && said.includes(o.ifCovered.phrase) ? o.ifCovered.text : o.text)),
    ...w.custom.map(sentence),
  ];
  const cautions = rest.filter((t) => !said.includes(t.toLowerCase().replace(/\.$/, "")));
  return [...required, ...(cautions.length ? [`Caution: ${cautions.join(" ")}`] : [])];
}

/** The standard warnings suggested for a kind of product. */
export function suggestedWarnings(typeKey: string, pack: MarketPack): string[] {
  return (pack.warnings ?? []).filter((o) => o.suggestFor?.includes(typeKey)).map((o) => o.key);
}
