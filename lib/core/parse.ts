import { UNIT_ALIASES } from "./units";
import type { RecipeLine } from "./types";

export interface ParsedEntry {
  lines: RecipeLine[];
  /** "makes 4" / "4 jars" sets how many a batch makes. */
  makes?: number;
}

const AMOUNT = String.raw`(\d+\s+\d+\/\d+|\d+\/\d+|\d*\.?\d+)`;
const MAKES_RE = /^(?:makes|yields?|made)\s*:?\s*(\d+)\b/i;
const COUNT_RE = /^(\d+)\s*(?:jars?|tins?|bottles?|units?|bars?|tubes?|pots?|candles?|pucks?)\b/i;

/**
 * Parse ingredients typed the way people talk:
 *   "12 oz shea butter, 1/2 cup almond oil, 10 drops lavender, makes 4"
 * Lines are split on commas, semicolons and new lines.
 * Anything without a recognisable amount becomes a line with an empty amount,
 * so the maker can fill it in rather than lose it.
 */
export function parseQuickEntry(text: string): ParsedEntry {
  const lines: RecipeLine[] = [];
  let makes: number | undefined;
  for (const raw of text.split(/[\n,;]+/)) {
    const part = raw.trim();
    if (!part) continue;
    const mk = part.match(MAKES_RE) ?? part.match(COUNT_RE);
    if (mk) {
      makes = Number(mk[1]);
      continue;
    }
    const m = part.match(new RegExp(`^${AMOUNT}\\s*(fl\\.?\\s*oz\\.?|[a-zA-Z]+\\.?)?\\s+(?:of\\s+)?(.+)$`));
    if (!m) {
      lines.push({ amount: "", unit: "g", text: part });
      continue;
    }
    const amount = m[1]!.trim();
    let name = m[3]!.trim();
    const rawUnit = (m[2] ?? "").toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim();
    const unitKey = rawUnit === "fl oz" || rawUnit === "floz" ? "floz" : rawUnit;
    let unit = UNIT_ALIASES[unitKey];
    if (!unit) {
      // The "unit" was really the first word of the ingredient ("2 vanilla beans").
      if (m[2]) name = `${m[2]} ${name}`;
      unit = "g";
    }
    lines.push({ amount, unit, text: name.replace(/^of\s+/i, "") });
  }
  return makes === undefined ? { lines } : { lines, makes };
}
