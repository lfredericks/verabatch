import { describe, expect, it } from "vitest";
import { computeRecipe, labelIngredients } from "../lib/core";
import { buildLabel } from "../lib/label";
import { cosmeticsPack } from "../lib/packs/cosmetics";
import { cleanLine } from "../lib/products";
import { diffRecipe, ensureKeys } from "../lib/variations";

const business = { name: "Test Maker", cityStateZip: "Anywhere, IN 46000", contact: "test.example" };

describe("picked names", () => {
  it("an official pick is used as the label name and isn't flagged", () => {
    const r = computeRecipe([{ amount: "1/2", unit: "cup", text: "mugwort oil", pick: { kind: "official", name: "Artemisia Vulgaris Oil" } }], cosmeticsPack);
    expect(r.unknown).toHaveLength(0);
    expect(r.custom).toHaveLength(0);
    expect(labelIngredients(r, cosmeticsPack)[0]!.name).toBe("Artemisia Vulgaris Oil");
  });

  it("'lavender blue' as the maker's own name skips the which-one question and is flagged", () => {
    const lines = [
      { amount: "1/2", unit: "cup" as const, text: "jojoba oil" },
      { amount: "10", unit: "drop" as const, text: "lavender", pick: { kind: "custom" as const, name: "Lavender Blue" } },
    ];
    const r = computeRecipe(lines, cosmeticsPack);
    expect(r.needsChoice).toHaveLength(0);
    expect(r.custom.map((l) => l.line.text)).toEqual(["lavender"]);
    const label = buildLabel({ product: { name: "X", type_key: "salve", identity: "Balm", makes: 1, recipe: lines }, business, size: null, pack: cosmeticsPack });
    expect(label.customNames).toEqual(["Lavender Blue"]);
    expect(label.ingredients).toContain("Lavender Blue");
    expect(label.blockers.join(" ")).not.toMatch(/which one/);
  });

  it("density guess follows the name", () => {
    expect(cosmeticsPack.guessDensity!("Artemisia Vulgaris Oil")).toBeCloseTo(0.91);
    expect(cosmeticsPack.guessDensity!("Euphorbia Cerifera Cera")).toBeCloseTo(0.96);
    expect(cosmeticsPack.guessDensity!("Lavender Blue")).toBe(1);
  });

  it("picks survive the server clean-up; junk picks don't", () => {
    expect(cleanLine({ amount: "1", unit: "drop", text: "x", pick: { kind: "custom", name: " Lavender Blue " } })!.pick).toEqual({ kind: "custom", name: "Lavender Blue" });
    expect(cleanLine({ amount: "1", unit: "drop", text: "x", pick: { kind: "evil", name: "y" } })!.pick).toBeUndefined();
  });

  it("changing a pick counts as a recipe change for variations", () => {
    const base = ensureKeys([{ amount: "10", unit: "drop", text: "lavender" }]);
    const edited = [{ ...base[0]!, pick: { kind: "custom" as const, name: "Lavender Blue" } }];
    expect(diffRecipe(base, edited)).toHaveLength(1);
  });
});
