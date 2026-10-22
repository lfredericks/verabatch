import { describe, expect, it } from "vitest";
import { findTemplate, LABEL_TEMPLATES, perSheet } from "../lib/labelTemplates";
import { readSizeForm, sizeFacts } from "../lib/sizes";
import { cosmeticsPack } from "../lib/packs/cosmetics";
import { buildLabelPdf, labelFileName } from "../lib/labelPdf";
import { loadLabelFonts } from "../lib/labelFonts/load";

const fd = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
};

describe("label sheet templates", () => {
  it("finds a sheet by its own number or a product number on the same layout", () => {
    expect(findTemplate("22807")?.label).toBe("2 in round, 12 per sheet");
    expect(findTemplate("22877")?.id).toBe("22807");
    expect(findTemplate("Avery 22830")?.id).toBe("22808");
    expect(findTemplate("99999")).toBeNull();
  });

  it("every layout fits on a letter sheet with no labels overlapping", () => {
    for (const tp of LABEL_TEMPLATES) {
      const w = tp.widthIn * 72;
      const h = tp.heightIn * 72;
      for (let i = 1; i < tp.colsPt.length; i++) expect(tp.colsPt[i]! - tp.colsPt[i - 1]!, tp.id).toBeGreaterThanOrEqual(w - 0.5);
      for (let i = 1; i < tp.rowsPt.length; i++) expect(tp.rowsPt[i]! - tp.rowsPt[i - 1]!, tp.id).toBeGreaterThanOrEqual(h - 0.5);
      expect(tp.colsPt.at(-1)! + w, tp.id).toBeLessThanOrEqual(612);
      expect(tp.rowsPt.at(-1)! + h, tp.id).toBeLessThanOrEqual(792);
      expect(new Set(LABEL_TEMPLATES.map((x) => x.id)).size).toBe(LABEL_TEMPLATES.length);
    }
    expect(perSheet(findTemplate("22807")!)).toBe(12);
  });

  it("a size keeps the sheet only while its label still matches", () => {
    const base = { name: "2 oz jar", fill_amount: "2", fill_unit: "oz", product_id: "p" };
    const r = readSizeForm(fd({ ...base, label_shape: "round", diameter_in: "2", label_template: "22807" }));
    expect("row" in r && r.row.label_template).toBe("22807");
    const changed = readSizeForm(fd({ ...base, label_shape: "round", diameter_in: "2.25", label_template: "22807" }));
    expect("row" in changed && changed.row.label_template).toBeNull();
  });

  it("oval labels: area, file name and a PDF that fits", async () => {
    const r = readSizeForm(fd({ name: "4 oz tin", fill_amount: "4", fill_unit: "oz", label_shape: "oval", width_in: "2.5", height_in: "1.5", label_template: "22804" }));
    expect("row" in r && r.row).toMatchObject({ label_shape: "oval", width_in: 2.5, height_in: 1.5, label_template: "22804" });
    const facts = sizeFacts({ id: "s", product_id: "p", name: "x", fill_amount: "4", fill_unit: "oz", label_shape: "oval", width_in: 2.5, height_in: 1.5, diameter_in: null }, cosmeticsPack.lettering);
    expect(facts.labelText).toBe("2.5 × 1.5 in oval");
    expect(facts.areaSqIn).toBeCloseTo(2.95, 2);
    expect(labelFileName({ business: "A", product: "B", size: "4 oz tin", shape: { shape: "oval", widthIn: 2.5, heightIn: 1.5 } })).toBe("A_B_4-oz-tin_2.5x1.5-oval.pdf");
    const out = await buildLabelPdf(
      { shape: { shape: "oval", widthIn: 3.333, heightIn: 2 }, name: "Garden Balm", identity: "Botanical Skin Balm", net: "Net Wt. 4 oz (113 g)", netMinIn: 1 / 8, back: ["Ingredients: Shea (Butyrospermum Parkii) Butter, Beeswax (Cera Alba)."], title: "t" },
      await loadLabelFonts(),
    );
    expect(out.warnings).toEqual([]);
  });
});

describe("net weight placement (21 CFR 701.13(f))", () => {
  it("bottom 30% by area: rectangles 30% of the height, circles and ovals 34%", async () => {
    const { bottomBandShare } = await import("../lib/labelPdf");
    expect(bottomBandShare({ shape: "rect", widthIn: 3, heightIn: 2 })).toBe(0.3);
    expect(bottomBandShare({ shape: "round", diameterIn: 2 })).toBeCloseTo(0.3402, 3);
    expect(bottomBandShare({ shape: "oval", widthIn: 2.5, heightIn: 1.5 })).toBeCloseTo(0.3402, 3);
  });
});
