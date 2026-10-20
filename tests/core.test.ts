/** Edge cases beyond the spec table: parsing, merging, unknowns, varieties. */
import { describe, expect, it } from "vitest";
import {
  computeRecipe,
  labelIngredients,
  lotNumber,
  netContentsForSize,
  netContentsFromBatch,
  parseAmount,
  parseQuickEntry,
} from "../lib/core";
import { cosmeticsPack, findIngredient } from "../lib/packs/cosmetics";

describe("parseAmount", () => {
  it.each([
    ["12", 12],
    ["0.5", 0.5],
    [".5", 0.5],
    ["1/2", 0.5],
    ["1 1/2", 1.5],
  ])("%s -> %d", (text, n) => expect(parseAmount(text)).toBe(n));

  it("returns NaN for words", () => expect(parseAmount("some")).toBeNaN());
});

describe("parseQuickEntry", () => {
  it("reads ingredients the way people type them", () => {
    const p = parseQuickEntry("12 oz shea butter, 1/2 cup almond oil, 10 drops lavender, makes 4");
    expect(p.makes).toBe(4);
    expect(p.lines).toEqual([
      { amount: "12", unit: "oz", text: "shea butter" },
      { amount: "1/2", unit: "cup", text: "almond oil" },
      { amount: "10", unit: "drop", text: "lavender" },
    ]);
  });

  it("understands fl oz, tablespoons and '4 jars'", () => {
    const p = parseQuickEntry("2 fl oz jojoba\n1 tbsp. rosehip oil; 4 jars");
    expect(p.makes).toBe(4);
    expect(p.lines[0]).toEqual({ amount: "2", unit: "floz", text: "jojoba" });
    expect(p.lines[1]).toEqual({ amount: "1", unit: "tbsp", text: "rosehip oil" });
  });

  it("keeps a line it can't read, with no amount, so nothing is lost", () => {
    const p = parseQuickEntry("a pinch of love");
    expect(p.lines).toEqual([{ amount: "", unit: "g", text: "a pinch of love" }]);
  });
});

describe("ingredient matching", () => {
  it("prefers the longest match", () => {
    expect(findIngredient("white beeswax pellets")?.key).toBe("beeswax-white");
    expect(findIngredient("beeswax")?.key).toBe("beeswax");
  });

  it("does not treat rose hip or rosemary as rose", () => {
    expect(cosmeticsPack.resolve({ amount: "1", unit: "tbsp", text: "rose hip oil" })).toMatchObject({
      status: "known",
      labelName: "Rosa Canina Fruit Oil",
    });
    expect(cosmeticsPack.resolve({ amount: "5", unit: "drop", text: "rosemary" })).toMatchObject({
      status: "known",
      labelName: "Rosmarinus Officinalis (Rosemary) Leaf Oil",
    });
  });

  it("returns unknown for something not in the dictionary", () => {
    expect(cosmeticsPack.resolve({ amount: "1", unit: "oz", text: "unicorn tears" }).status).toBe("unknown");
  });
});

describe("varieties", () => {
  it("resolves a fully described botanical with no questions", () => {
    expect(cosmeticsPack.resolve({ amount: "2", unit: "oz", text: "roman chamomile essential oil" })).toMatchObject({
      status: "known",
      labelName: "Anthemis Nobilis Flower Oil",
    });
  });

  it("lists both plants for an infused oil", () => {
    expect(cosmeticsPack.resolve({ amount: "3", unit: "oz", text: "calendula infused olive oil" })).toMatchObject({
      status: "known",
      labelName: "Olea Europaea (Olive) Fruit Oil, Calendula Officinalis Flower Extract",
    });
  });

  it("asks for the carrier when an infused oil doesn't name one", () => {
    expect(cosmeticsPack.resolve({ amount: "3", unit: "oz", text: "calendula infused oil" })).toMatchObject({
      status: "needsChoice",
      missing: "carrier",
    });
  });

  it("reads 'cinnamon leaf oil' as an oil, not dried leaves", () => {
    expect(cosmeticsPack.resolve({ amount: "2", unit: "drop", text: "cinnamon leaf oil" })).toMatchObject({
      status: "known",
      labelName: "Cinnamomum Zeylanicum Leaf Oil",
    });
  });

  it("asks for the form when it can't tell", () => {
    expect(cosmeticsPack.resolve({ amount: "1", unit: "oz", text: "peppermint" })).toMatchObject({
      status: "needsChoice",
      missing: "form",
      known: { variety: "pepper" },
    });
  });

  it("uses the maker's choice once given", () => {
    expect(
      cosmeticsPack.resolve({
        amount: "10",
        unit: "drop",
        text: "chamomile",
        variety: { group: "chamomile", variety: "german" },
      }),
    ).toMatchObject({ status: "known", labelName: "Chamomilla Recutita (Matricaria) Flower Oil" });
  });
});

describe("recipes and labels", () => {
  it("lists white and natural beeswax once, as Beeswax", () => {
    const r = computeRecipe(
      [
        { amount: "100", unit: "g", text: "shea butter" },
        { amount: "20", unit: "g", text: "white beeswax" },
        { amount: "20", unit: "g", text: "natural beeswax" },
      ],
      cosmeticsPack,
    );
    expect(labelIngredients(r, cosmeticsPack).map((i) => i.name)).toEqual([
      "Butyrospermum Parkii (Shea) Butter",
      "Beeswax",
    ]);
  });

  it("flags unresolved and unknown lines instead of guessing", () => {
    const r = computeRecipe(
      [
        { amount: "100", unit: "g", text: "shea butter" },
        { amount: "10", unit: "drop", text: "chamomile" },
        { amount: "5", unit: "g", text: "unicorn tears" },
      ],
      cosmeticsPack,
    );
    expect(r.needsChoice).toHaveLength(1);
    expect(r.unknown).toHaveLength(1);
    const list = labelIngredients(r, cosmeticsPack);
    expect(list.find((i) => i.name === "Unicorn Tears")?.unresolved).toBe(true);
  });

  it("skips lines with no amount", () => {
    const r = computeRecipe([{ amount: "", unit: "g", text: "shea" }], cosmeticsPack);
    expect(r.lines).toHaveLength(0);
    expect(r.skipped).toHaveLength(1);
  });
});

describe("net contents and lots", () => {
  it("handles grams and mL fills", () => {
    expect(netContentsForSize(60, "g")).toBe("Net Wt. 2.11 oz (60 g)");
    expect(netContentsForSize(30, "ml")).toBe("1.01 fl oz (30 mL)");
  });

  it("declares by volume when asked", () => {
    expect(netContentsFromBatch(0, 240, 2, "volume")).toBe("4.0 fl oz (120 mL)");
  });

  it("refuses zero units", () => {
    expect(() => netContentsFromBatch(100, 0, 0, "weight")).toThrow();
  });

  it("keeps counting after a deleted lot", () => {
    expect(lotNumber("Relief Balm", "2026-10-20", ["RB-261020-1", "RB-261020-3"])).toBe("RB-261020-4");
  });
});
