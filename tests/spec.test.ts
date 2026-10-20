/**
 * The test cases from the Verabatch v1 Spec, "Calculation and labeling rules".
 * All must pass before Liminalia testing. A rule change means a test change first.
 */
import { describe, expect, it } from "vitest";
import {
  checkClaims,
  computeRecipe,
  convert,
  labelArea,
  labelIngredients,
  lotNumber,
  minLetterHeight,
  netContentsForSize,
  netContentsFromBatch,
  parseAmount,
} from "../lib/core";
import { cosmeticsPack } from "../lib/packs/cosmetics";

const round2 = (n: number) => Math.round(n * 100) / 100;

describe("Spec test cases", () => {
  it("Weight conversion: 12 oz shea butter = 340.19 g", () => {
    const c = convert(parseAmount("12"), "oz", 0.91);
    expect(round2(c.grams)).toBe(340.19);
    expect(c.approximate).toBe(false);
  });

  it("Volume conversion: 1/2 cup sweet almond oil (density 0.91) = 107.65 g, marked approximate", () => {
    const c = convert(parseAmount("1/2"), "cup", 0.91);
    expect(round2(c.grams)).toBe(107.65);
    expect(c.approximate).toBe(true);
  });

  it("Drops: 10 drops lavender essential oil (density 0.90) = 0.45 g, listed after the 1%+ ingredients", () => {
    expect(round2(convert(10, "drop", 0.9).grams)).toBe(0.45);

    const recipe = computeRecipe(
      [
        { amount: "10", unit: "drop", text: "Lavender essential oil", variety: { group: "lavender", variety: "true" } },
        { amount: "12", unit: "oz", text: "Shea butter" },
        { amount: "1/2", unit: "cup", text: "Sweet almond oil" },
      ],
      cosmeticsPack,
    );
    const list = labelIngredients(recipe, cosmeticsPack);
    expect(list.map((i) => i.name)).toEqual([
      "Butyrospermum Parkii (Shea) Butter",
      "Prunus Amygdalus Dulcis (Sweet Almond) Oil",
      "Lavandula Angustifolia (Lavender) Oil",
    ]);
    expect(list[2]!.minor).toBe(true);
    expect(round2(recipe.lines[0]!.grams)).toBe(0.45);
  });

  it("Net weight, sized: 4 oz jar = Net Wt. 4 oz (113 g)", () => {
    expect(netContentsForSize(4, "oz")).toBe("Net Wt. 4 oz (113 g)");
  });

  it("Net volume, sized: 8 fl oz bottle = 8 fl oz (236 mL)", () => {
    expect(netContentsForSize(8, "floz")).toBe("8 fl oz (236 mL)");
  });

  it("Net weight, unsized: 470 g batch, makes 4 = Net Wt. 4.1 oz (117 g)", () => {
    expect(netContentsFromBatch(470, 0, 4, "weight")).toBe("Net Wt. 4.1 oz (117 g)");
  });

  it("Lettering, small: 2 in round label (3.1 sq in) = 1/16 in", () => {
    const area = labelArea({ shape: "round", diameterIn: 2 });
    expect(round2(area)).toBe(3.14);
    expect(minLetterHeight(area, cosmeticsPack.lettering).minHeight).toBe("1/16 in");
  });

  it("Lettering, medium: 3 x 2 in label (6 sq in) = 1/8 in", () => {
    const area = labelArea({ shape: "rect", widthIn: 3, heightIn: 2 });
    expect(area).toBe(6);
    expect(minLetterHeight(area, cosmeticsPack.lettering).minHeight).toBe("1/8 in");
  });

  it("Lot numbers: two batches of Midnight Garden on Oct 16, 2026 = MG-261016-1, then MG-261016-2", () => {
    const first = lotNumber("Midnight Garden", "2026-10-16", []);
    const second = lotNumber("Midnight Garden", "2026-10-16", [first]);
    expect(first).toBe("MG-261016-1");
    expect(second).toBe("MG-261016-2");
  });

  it("Variety prompt: \"10 drops chamomile\" asks which chamomile, with the form already set to essential oil", () => {
    const r = cosmeticsPack.resolve({ amount: "10", unit: "drop", text: "chamomile" });
    expect(r.status).toBe("needsChoice");
    if (r.status !== "needsChoice") return;
    expect(r.question).toBe("Which chamomile?");
    expect(r.missing).toBe("variety");
    expect(r.known.form).toBe("eo");
  });

  it("Claims check: a product named \"Relief Balm\" flags \"relief\" as a pain-relief claim", () => {
    const hits = checkClaims("Relief Balm", cosmeticsPack.claimRules);
    expect(hits).toHaveLength(1);
    expect(hits[0]!.word).toBe("Relief");
    expect(hits[0]!.severity).toBe("drug");
  });
});
