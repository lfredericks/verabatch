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

describe("advertising claims (FTC)", () => {
  const words = (t: string) => findClaimMatches(t, cosmeticsPack.claimRules).map((m) => m.word.toLowerCase());
  it("flags 'best in the industry' and comparisons to other brands", () => {
    expect(words("Our balm is the best in the industry! Move over Tiger Balm, this one is better than the rest.")).toEqual(["best", "move over", "tiger balm", "better than"]);
  });
  it("flags rankings, guarantees and natural/safety buzzwords", () => {
    expect(words("#1 best-selling, guaranteed results. Chemical-free and non-toxic.")).toEqual(["#1", "best-selling", "guaranteed", "chemical-free", "non-toxic"]);
  });
  it("leaves ordinary wording alone", () => {
    expect(words("Hand-poured in small batches with plant oils. Smells like a walk in the woods.")).toEqual([]);
  });
});

describe("other companies' brands", () => {
  const words = (t: string) => findClaimMatches(t, cosmeticsPack.claimRules).map((m) => m.word.toLowerCase());
  it("flags brand names and dupe wording", () => {
    expect(words("A Vicks VapoRub dupe, inspired by Baccarat Rouge. Like Burt's Bees but better.")).toEqual(["vicks", "vaporub", "dupe", "inspired by", "baccarat rouge", "burt's bees"]);
  });
  it("brands that are everyday words: only when written like a brand", () => {
    expect(words("A gentle method for dry hands. Lush lather from native plants.")).toEqual([]);
    expect(words("Smells just like the one from Lush, and gentler than Dove.")).toEqual(["lush", "dove"]);
  });
});
