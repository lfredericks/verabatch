import { describe, expect, it } from "vitest";
import { computeRecipe, labelIngredients, parseQuickEntry } from "../lib/core";
import { cosmeticsPack } from "../lib/packs/cosmetics";
import { cleanRecipe } from "../lib/products";

/** The Relief Balm recipe as Leslie would paste it (docs/LIMINALIA.md). */
const RELIEF_BALM = `1/4 cup avocado oil
1/2 cup jojoba oil
1/4 cup coconut oil
1 tbsp vitamin e oil
1/4 cup white beeswax pearls
10 drops lavender
35 drops eucalyptus
35 drops peppermint
15 drops clove
10 drops rosemary
45 drops arnica
2 drops cayenne
makes 5`;

describe("Relief Balm through the product editor", () => {
  const parsed = parseQuickEntry(RELIEF_BALM);

  it("pasting reads every line and the batch count", () => {
    expect(parsed.lines).toHaveLength(12);
    expect(parsed.makes).toBe(5);
    expect(parsed.lines[0]).toEqual({ amount: "1/4", unit: "cup", text: "avocado oil" });
  });

  it("only the bottle questions are left to answer", () => {
    const r = computeRecipe(parsed.lines, cosmeticsPack);
    expect(r.unknown).toHaveLength(0);
    expect(r.needsChoice.map((l) => (l.resolution.status === "needsChoice" ? l.resolution.group : ""))).toEqual([
      "lavender",
      "eucalyptus",
      "clove",
      "arnica",
      "cayenne",
    ]);
  });

  it("answers turn into label names, largest first", () => {
    const answered = parsed.lines.map((l) => {
      const v: Record<string, { variety?: string; form?: string; carrier?: string }> = {
        lavender: { variety: "true", form: "eo" },
        eucalyptus: { variety: "globulus", form: "eo" },
        clove: { variety: "bud", form: "eo" },
        arnica: { variety: "montana", form: "infused", carrier: "sunflower" },
        cayenne: { variety: "frutescens", form: "extract" },
      };
      const key = Object.keys(v).find((k) => l.text.includes(k));
      return key ? { ...l, variety: { group: key, ...v[key] } } : l;
    });
    const r = computeRecipe(answered, cosmeticsPack);
    expect(r.needsChoice).toHaveLength(0);
    const names = labelIngredients(r, cosmeticsPack).map((i) => i.name);
    expect(names[0]).toBe("Simmondsia Chinensis (Jojoba) Seed Oil");
    expect(names).toContain("Eugenia Caryophyllus (Clove) Bud Oil");
    expect(names).toContain("Capsicum Frutescens Fruit Extract");
  });

  it("each choice question offers options", () => {
    const r = computeRecipe(parsed.lines, cosmeticsPack);
    for (const l of r.needsChoice) {
      if (l.resolution.status !== "needsChoice") continue;
      expect(cosmeticsPack.choices!(l.resolution).length).toBeGreaterThan(0);
    }
  });
});

describe("cleanRecipe keeps what was typed and drops junk", () => {
  it("keeps amounts as text and drops blanks", () => {
    expect(
      cleanRecipe([
        { amount: " 1/2 ", unit: "cup", text: "almond oil", variety: { group: "x", variety: "y", evil: "z" } },
        { amount: "", unit: "g", text: "" },
        { amount: "2", unit: "bogus", text: "shea" },
        "nonsense",
      ]),
    ).toEqual([
      { amount: "1/2", unit: "cup", text: "almond oil", variety: { group: "x", variety: "y" } },
      { amount: "2", unit: "g", text: "shea" },
    ]);
  });
  it("rejects non-lists", () => {
    expect(cleanRecipe({ a: 1 })).toEqual([]);
  });
});

describe("infused oils", () => {
  it("carrier oil merges with the same oil elsewhere; the plant is a trace", () => {
    const r = computeRecipe(
      [
        { amount: "1/2", unit: "cup", text: "jojoba oil" },
        { amount: "1/4", unit: "cup", text: "coconut oil" },
        { amount: "45", unit: "drop", text: "arnica", variety: { group: "arnica", variety: "montana", form: "infused", carrier: "jojoba" } },
        { amount: "2", unit: "drop", text: "cayenne", variety: { group: "cayenne", variety: "frutescens", form: "infused", carrier: "jojoba" } },
      ],
      cosmeticsPack,
    );
    const list = labelIngredients(r, cosmeticsPack);
    const names = list.map((i) => i.name);
    expect(names.filter((n) => n.includes("Jojoba"))).toHaveLength(1);
    expect(names[0]).toBe("Simmondsia Chinensis (Jojoba) Seed Oil");
    expect(names).toContain("Arnica Montana Flower Extract");
    expect(names).toContain("Capsicum Frutescens Fruit Extract");
    expect(list.find((i) => i.name === "Arnica Montana Flower Extract")!.minor).toBe(true);
    expect(names.indexOf("Arnica Montana Flower Extract")).toBeGreaterThan(names.indexOf("Cocos Nucifera (Coconut) Oil"));
  });
});
