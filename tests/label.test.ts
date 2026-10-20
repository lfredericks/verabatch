import { describe, expect, it } from "vitest";
import { parseQuickEntry } from "../lib/core";
import { buildLabel } from "../lib/label";
import { cosmeticsPack } from "../lib/packs/cosmetics";
import { readSizeForm, sizeFacts, type Size } from "../lib/sizes";

const recipe = parseQuickEntry("1/2 cup jojoba oil, 1/4 cup coconut oil, 1/4 cup white beeswax pearls, 1 tbsp vitamin e oil, 35 drops peppermint").lines;
const business = { name: "Liminalia", cityStateZip: "Anderson, IN 46016", contact: "liminalia.co" };
const jar: Size = {
  id: "s1", product_id: "p1", name: "2 oz jar", fill_amount: "2", fill_unit: "oz",
  label_shape: "round", width_in: null, height_in: null, diameter_in: 2,
};

describe("Relief Balm 2 oz label (milestone 4 target)", () => {
  const label = buildLabel({
    product: { name: "Relief Balm", type_key: "salve", identity: "Botanical Skin Balm", makes: 5, recipe },
    business, size: jar, pack: cosmeticsPack,
  });

  it("front: name, what it is, net weight", () => {
    expect(label.front).toEqual(["Relief Balm", "Botanical Skin Balm", "Net Wt. 2 oz (56 g)"]);
  });
  it("lettering for a 2 in round label is 1/16 in", () => {
    expect(label.size?.lettering?.minHeight).toBe("1/16 in");
  });
  it("back: ingredients, who made it, reactions contact", () => {
    expect(label.back[0]).toMatch(/^Ingredients: Simmondsia Chinensis \(Jojoba\) Seed Oil, /);
    expect(label.back[1]).toBe("Made by Liminalia, Anderson, IN 46016.");
    expect(label.back[2]).toBe("Questions or reactions: liminalia.co");
  });
  it("flags 'relief' (spec claims test case)", () => {
    expect(label.claims.map((c) => c.word.toLowerCase())).toContain("relief");
  });
  it("nothing blocks printing", () => {
    expect(label.blockers).toEqual([]);
  });
});

describe("label blockers", () => {
  it("name repeated as what-it-is, and no size or batch count", () => {
    const l = buildLabel({
      product: { name: "Relief Balm", type_key: "salve", identity: "Relief Balm", makes: null, recipe },
      business, size: null, pack: cosmeticsPack,
    });
    expect(l.blockers.join(" ")).toMatch(/repeats the name/);
    expect(l.blockers.join(" ")).toMatch(/net weight/);
  });
  it("without a size, net weight comes from the batch", () => {
    const l = buildLabel({
      product: { name: "X", type_key: "salve", identity: "Balm", makes: 5, recipe },
      business, size: null, pack: cosmeticsPack,
    });
    expect(l.net).toMatch(/^Net Wt\. \d\.\d oz \(\d+ g\)$/);
    expect(l.approximate).toBe(true);
  });
  it("home products skip the reactions line", () => {
    const l = buildLabel({
      product: { name: "Sleep Tight", type_key: "room", identity: "Room & Linen Spray", makes: 1, recipe },
      business, size: { ...jar, fill_amount: "4", fill_unit: "floz" }, pack: cosmeticsPack,
    });
    expect(l.back.some((b) => b.startsWith("Questions or reactions"))).toBe(false);
    expect(l.net).toBe("4 fl oz (118 mL)");
  });
});

describe("size form", () => {
  const fd = (o: Record<string, string>) => {
    const f = new FormData();
    for (const [k, v] of Object.entries(o)) f.set(k, v);
    return f;
  };
  it("reads a round 2 oz jar", () => {
    const r = readSizeForm(fd({ name: "2 oz jar", fill_amount: "2", fill_unit: "oz", label_shape: "round", diameter_in: "2", product_id: "p" }));
    expect("row" in r && r.row).toMatchObject({ fill_amount: "2", label_shape: "round", diameter_in: 2, width_in: null });
  });
  it("accepts fractions of an inch", () => {
    const r = readSizeForm(fd({ name: "x", fill_amount: "1/2", fill_unit: "floz", label_shape: "rect", width_in: "2 1/2", height_in: "3/4" }));
    expect("row" in r && r.row).toMatchObject({ width_in: 2.5, height_in: 0.75 });
  });
  it("rejects a missing fill amount", () => {
    expect(readSizeForm(fd({ name: "x", fill_amount: "", fill_unit: "oz" }))).toHaveProperty("error");
  });
  it("3 x 2 in label needs 1/8 in letters (spec)", () => {
    expect(sizeFacts({ ...jar, label_shape: "rect", width_in: 3, height_in: 2, diameter_in: null }, cosmeticsPack.lettering).lettering?.minHeight).toBe("1/8 in");
  });
});
