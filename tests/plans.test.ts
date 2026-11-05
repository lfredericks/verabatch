import { describe, expect, it } from "vitest";
import type { RecipeLine } from "../lib/core";
import { isBigSwap, productPrint } from "../lib/plans";

const L = (text: string): RecipeLine => ({ amount: "1", unit: "oz", text });
const base = ["shea butter", "cocoa butter", "jojoba oil", "vitamin e oil", "lavender essential oil"];

describe("three-strikes: what counts as a different product", () => {
  const before = productPrint("Lavender Body Butter", base.map(L));
  it("new name plus new scent is a swap, even with the same base", () => {
    const after = productPrint("Peppermint Body Butter", [...base.slice(0, 4), "peppermint essential oil"].map(L));
    expect(isBigSwap(before, after)).toBe(true);
  });
  it("a typo fix in the name is not", () => {
    expect(isBigSwap(before, productPrint("Lavendar Body Butter", base.map(L)))).toBe(false);
  });
  it("new amounts, same ingredients, are not", () => {
    expect(isBigSwap(before, productPrint("Lavender Body Butter", base.map((t) => ({ ...L(t), amount: "2" }))))).toBe(false);
  });
  it("a new scent alone, same name, is not", () => {
    expect(isBigSwap(before, productPrint("Lavender Body Butter", [...base.slice(0, 4), "lavandin essential oil"].map(L)))).toBe(false);
  });
  it("80% of the recipe replaced is a swap, whatever the name", () => {
    const after = productPrint("Lavender Body Butter", ["mango butter", "beeswax", "olive oil", "castor oil", "lavender essential oil"].map(L));
    expect(isBigSwap(before, after)).toBe(true);
  });
});
