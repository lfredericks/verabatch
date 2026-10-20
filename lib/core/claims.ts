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
