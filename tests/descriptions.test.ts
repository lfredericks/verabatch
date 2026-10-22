import { describe, expect, it } from "vitest";
import { cleanDescriptions } from "../lib/channels";
import { findClaimMatches } from "../lib/core";
import { cosmeticsPack } from "../lib/packs/cosmetics";

describe("description claims check", () => {
  it("finds every risky word with its place, for highlighting", () => {
    const text = "This soothing balm relieves sore muscles and calms inflammation. Heals dry skin.";
    const m = findClaimMatches(text, cosmeticsPack.claimRules);
    expect(m.map((x) => x.word.toLowerCase())).toEqual(["relieves", "sore muscles", "inflammation", "heals"]);
    for (const x of m) expect(text.slice(x.start, x.end)).toBe(x.word);
  });
  it("plain cosmetic wording passes", () => {
    expect(findClaimMatches("A rich, warming balm with lavender and rosemary for dry, tired skin.", cosmeticsPack.claimRules)).toEqual([]);
  });
  it("keeps only known channels and text", () => {
    expect(cleanDescriptions({ etsy: "Hi", amazon: "", bogus: "x", website: 5 })).toEqual({ etsy: "Hi" });
    expect(cleanDescriptions(null)).toEqual({});
  });
});
