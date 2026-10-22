import { describe, expect, it } from "vitest";
import { computeRecipe } from "../lib/core";
import { buildLabel, printedIngredients } from "../lib/label";
import { cosmeticsPack } from "../lib/packs/cosmetics";
import { printName } from "../lib/packs/cosmetics/commonNames";

describe("US label names: common name first, Latin in brackets", () => {
  it("FDA's own example", () => {
    expect(printName("Prunus Amygdalus Dulcis (Sweet Almond) Oil").text).toBe("Sweet Almond (Prunus Amygdalus Dulcis) Oil");
  });
  it("official names with the common name in brackets are flipped", () => {
    expect(printName("Simmondsia Chinensis (Jojoba) Seed Oil").text).toBe("Jojoba (Simmondsia Chinensis) Seed Oil");
    expect(printName("Butyrospermum Parkii (Shea) Butter").text).toBe("Shea (Butyrospermum Parkii) Butter");
    expect(printName("Melaleuca Alternifolia (Tea Tree) Leaf Oil").text).toBe("Tea Tree (Melaleuca Alternifolia) Leaf Oil");
  });
  it("Latin-only names get the common name from our table", () => {
    expect(printName("Arnica Montana Flower Extract").text).toBe("Arnica (Arnica Montana) Flower Extract");
    expect(printName("Capsicum Frutescens Fruit Extract").text).toBe("Cayenne Pepper (Capsicum Frutescens) Fruit Extract");
    expect(printName("Artemisia Vulgaris Oil").text).toBe("Mugwort (Artemisia Vulgaris) Oil");
    expect(printName("Chamomilla Recutita (Matricaria) Flower Oil").text).toBe("German Chamomile (Chamomilla Recutita) Flower Oil");
  });
  it("non-plant names stay as they are", () => {
    for (const n of ["Water", "Tocopherol", "Beeswax", "Glycerin", "Hydrogenated Soybean Oil", "Caprylic/Capric Triglyceride", "Fragrance"])
      expect(printName(n)).toEqual({ text: n, needsCommon: false });
  });
  it("an unknown plant asks for an everyday name, and uses the maker's", () => {
    expect(printName("Viburnum Opulus Bark Extract")).toEqual({ text: "Viburnum Opulus Bark Extract", needsCommon: true });
    expect(printName("Viburnum Opulus Bark Extract", "Cramp Bark").text).toBe("Cramp Bark (Viburnum Opulus) Bark Extract");
  });
  it("every curated name prints with a common name or isn't a plant", () => {
    // Nothing we ship should block a label for a missing everyday name.
    const lines = [{ amount: "1", unit: "oz" as const, text: "eucalyptus", variety: { group: "eucalyptus", variety: "globulus", form: "eo" } }];
    expect(printedIngredients(computeRecipe(lines, cosmeticsPack), cosmeticsPack)).toEqual({ names: ["Eucalyptus (Eucalyptus Globulus) Leaf Oil"], needsCommon: [] });
  });
  it("a picked plant name with no common name blocks the label until one is added", () => {
    const business = { name: "M", cityStateZip: "X, IN 1", contact: "m.example" };
    const line = { amount: "1", unit: "oz" as const, text: "cramp bark", pick: { kind: "official" as const, name: "Viburnum Opulus Bark Extract" } };
    const product = { name: "Balm", type_key: "salve", identity: "Skin Balm", makes: 1 };
    const without = buildLabel({ product: { ...product, recipe: [line] }, business, size: null, pack: cosmeticsPack });
    expect(without.blockers.join(" ")).toMatch(/everyday name/);
    const withName = buildLabel({ product: { ...product, recipe: [{ ...line, common: "Cramp Bark" }] }, business, size: null, pack: cosmeticsPack });
    expect(withName.ingredients).toBe("Ingredients: Cramp Bark (Viburnum Opulus) Bark Extract.");
    expect(withName.blockers.join(" ")).not.toMatch(/everyday name/);
  });
  it("the maker's own names print exactly as typed", () => {
    const r = computeRecipe([{ amount: "1", unit: "oz", text: "lavender", pick: { kind: "custom", name: "Lavender Blue" } }], cosmeticsPack);
    expect(printedIngredients(r, cosmeticsPack).names).toEqual(["Lavender Blue"]);
  });
});

describe("non-plant names never get a made-up common name", () => {
  it("minerals and chemicals stay official", () => {
    for (const n of ["Citric Acid", "Sodium Bicarbonate", "Magnesium Sulfate", "Charcoal Powder", "Maris Sal", "Sodium Chloride"])
      expect(printName(n)).toEqual({ text: n, needsCommon: false });
  });
});
