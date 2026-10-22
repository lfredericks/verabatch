import type { ClaimHit, ClaimRule } from "./types";

/**
 * Check product names and descriptions for risky words.
 * Each rule reports at most once, with the first matching word.
 */
export function checkClaims(text: string, rules: ClaimRule[]): ClaimHit[] {
  const hits: ClaimHit[] = [];
  for (const rule of rules) {
    const m = text.match(rule.pattern);
    if (m) hits.push({ word: m[0], severity: rule.severity, why: rule.why, fix: rule.fix });
  }
  return hits;
}

export interface ClaimMatch extends ClaimHit {
  /** Where the word is in the text. */
  start: number;
  end: number;
}

/** Every risky word in the text, in order, for highlighting. */
export function findClaimMatches(text: string, rules: ClaimRule[]): ClaimMatch[] {
  const out: ClaimMatch[] = [];
  for (const rule of rules) {
    const re = new RegExp(rule.pattern.source, rule.pattern.flags.includes("g") ? rule.pattern.flags : rule.pattern.flags + "g");
    for (const m of text.matchAll(re)) {
      out.push({ word: m[0], severity: rule.severity, why: rule.why, fix: rule.fix, start: m.index ?? 0, end: (m.index ?? 0) + m[0].length });
    }
  }
  // Earliest first; where two rules hit the same words, keep the first rule's.
  out.sort((a, b) => a.start - b.start || b.end - a.end);
  return out.filter((m, i) => i === 0 || m.start >= out[i - 1]!.end);
}
