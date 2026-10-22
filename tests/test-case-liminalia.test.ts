/**
 * Test case, not product logic: one real maker's ingredient list (Liminalia,
 * docs/test-cases/liminalia.md) must resolve to label names or ask the right question.
 * Varieties marked TODO wait on what's printed on Leslie's bottles.
 */
import { describe, expect, it } from "vitest";
import { resolveLine } from "../lib/packs/cosmetics";
import type { RecipeLine } from "../lib/core";

const known: [string, RecipeLine["unit"], string][] = [
  ["Avocado oil", "floz", "Persea Gratissima (Avocado) Oil"],
  ["Jojoba oil", "floz", "Simmondsia Chinensis (Jojoba) Seed Oil"],
  ["Coconut oil", "floz", "Cocos Nucifera (Coconut) Oil"],
  ["Vitamin E oil", "tbsp", "Tocopherol"],
  ["White beeswax pearls", "floz", "Beeswax"],
  ["Witch hazel", "floz", "Hamamelis Virginiana (Witch Hazel) Water"],
  ["Distilled water", "floz", "Water"],
  ["Peppermint", "drop", "Mentha Piperita (Peppermint) Oil"],
  ["Rosemary", "drop", "Rosmarinus Officinalis (Rosemary) Leaf Oil"],
  ["Roman chamomile", "drop", "Anthemis Nobilis Flower Oil"],
  ["Sweet orange", "drop", "Citrus Aurantium Dulcis (Orange) Peel Oil"],
  ["Ylang ylang", "drop", "Cananga Odorata Flower Oil"],
  ["Bergamot", "drop", "Citrus Aurantium Bergamia (Bergamot) Fruit Oil"],
  ["Lemon", "drop", "Citrus Limon (Lemon) Peel Oil"],
];

// Asks which one: the answer is on the bottle.
const asks: [string, string][] = [
  ["Lavender", "lavender"],
  ["Eucalyptus", "eucalyptus"],
  ["Cedarwood", "cedarwood"],
  ["Frankincense", "frankincense"],
  ["Sandalwood", "sandalwood"],
  ["Clove", "clove"],
  ["Arnica", "arnica"],
  ["Cayenne", "cayenne"],
];

describe("Liminalia ingredients", () => {
  for (const [text, unit, label] of known) {
    it(`${text} → ${label}`, () => {
      const r = resolveLine({ amount: "1", unit, text });
      expect(r.status).toBe("known");
      if (r.status === "known") expect(r.labelName).toBe(label);
    });
  }
  for (const [text, group] of asks) {
    it(`${text} asks which one`, () => {
      const r = resolveLine({ amount: "1", unit: "drop", text });
      expect(r.status).toBe("needsChoice");
      if (r.status === "needsChoice") expect(r.group).toBe(group);
    });
  }
  it("lemon eucalyptus is still eucalyptus, not lemon", () => {
    const r = resolveLine({ amount: "1", unit: "drop", text: "Lemon eucalyptus" });
    expect(r.status === "needsChoice" ? r.group : r.status === "known" ? r.labelName : "unknown").not.toContain("Limon");
  });
});
