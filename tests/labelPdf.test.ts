import { describe, expect, it } from "vitest";
import { PDFDocument, PDFDict, PDFName } from "pdf-lib";
import { buildLabelPdf, LABEL_FONT_FAMILIES, type LabelPdfInput } from "../lib/labelPdf";
import { loadLabelFonts } from "../lib/labelFonts/load";

const ingredients =
  "Ingredients: Sweet Almond (Prunus Amygdalus Dulcis) Oil, Shea (Butyrospermum Parkii) Butter, Beeswax (Cera Alba), Lavender (Lavandula Angustifolia) Oil, Tocopherol.";
const base: Omit<LabelPdfInput, "shape" | "netMinIn"> = {
  name: "Garden Balm",
  identity: "Botanical Skin Balm",
  net: "Net Wt. 2 oz (56 g)",
  back: [ingredients, "Made by Hollow Pine Soap Co., Bend, OR 97701, USA.", "Questions or reactions: hollowpine.example", "Lot 2026-014"],
  title: "Garden Balm label",
};

async function fontNames(bytes: Uint8Array): Promise<string[]> {
  const doc = await PDFDocument.load(bytes);
  const names = new Set<string>();
  for (const page of doc.getPages()) {
    const fonts = page.node.Resources()?.lookup(PDFName.of("Font"), PDFDict);
    for (const [, ref] of fonts?.entries() ?? []) {
      const dict = doc.context.lookup(ref, PDFDict);
      names.add(String(dict.get(PDFName.of("BaseFont"))).replace(/^\/([A-Z]{6}\+)?/, ""));
    }
  }
  return [...names].sort();
}

describe("label PDF", () => {
  it("is two pages at the label's exact size (3 × 2 in)", async () => {
    const out = await buildLabelPdf({ ...base, shape: { shape: "rect", widthIn: 3, heightIn: 2 }, netMinIn: 1 / 8 }, await loadLabelFonts());
    const doc = await PDFDocument.load(out.bytes);
    expect(doc.getPageCount()).toBe(2);
    for (const p of doc.getPages()) expect(p.getSize()).toEqual({ width: 216, height: 144 });
    expect(out.warnings).toEqual([]);
  });

  it("round labels get a square page the width of the circle", async () => {
    const out = await buildLabelPdf({ ...base, shape: { shape: "round", diameterIn: 2.5 }, netMinIn: 1 / 16 }, await loadLabelFonts());
    const doc = await PDFDocument.load(out.bytes);
    expect(doc.getPages()[0]!.getSize()).toEqual({ width: 180, height: 180 });
    expect(out.warnings).toEqual([]);
  });

  it("uses only the two Canva font families", async () => {
    const out = await buildLabelPdf({ ...base, shape: { shape: "round", diameterIn: 2 }, netMinIn: 1 / 16 }, await loadLabelFonts());
    const names = await fontNames(out.bytes);
    expect(names).toEqual(["Lato-Bold", "Lato-Regular", "LibreBaskerville-Regular"]);
    const families = new Set(names.map((n) => (n.startsWith("Lato") ? "Lato" : "Libre Baskerville")));
    expect([...families].sort()).toEqual([...LABEL_FONT_FAMILIES].sort());
  });

  it("letters meet the FDA minimums: capitals for the net weight, lowercase o for the rest", async () => {
    // Lato Bold's capitals are about 0.72 of the point size; Lato's x-height about 0.506.
    const out = await buildLabelPdf({ ...base, shape: { shape: "rect", widthIn: 3, heightIn: 2 }, netMinIn: 1 / 8 }, await loadLabelFonts());
    expect(out.sizes.net * 0.716).toBeGreaterThanOrEqual(72 / 8);
    expect(out.sizes.back * 0.506).toBeGreaterThanOrEqual(72 / 16);
  });

  it("says so when the back won't fit at legal size", async () => {
    const long = { ...base, back: [Array.from({ length: 12 }, () => ingredients).join(" "), ...base.back.slice(1)] };
    const out = await buildLabelPdf({ ...long, shape: { shape: "round", diameterIn: 1.5 }, netMinIn: 1 / 16 }, await loadLabelFonts());
    expect(out.warnings.join(" ")).toMatch(/doesn't fit|under 1\/16 in/);
  });
});

describe("line breaks", () => {
  it("keeps amounts with their units", async () => {
    const { keepTogether } = await import("../lib/labelPdf");
    const t = keepTogether("Net Wt. 2 oz (56 g)").split(" ");
    expect(t).toEqual(["Net Wt. 2 oz", "(56 g)"]);
    expect(keepTogether("Net 4 fl oz (118 mL)").split(" ")).toEqual(["Net 4 fl oz", "(118 mL)"]);
  });
});

describe("logos and file names", () => {
  it("puts both logos side by side on the front, none on the back", async () => {
    const { readFileSync } = await import("node:fs");
    const png = new Uint8Array(readFileSync("tests/fixtures/logo.png"));
    const out = await buildLabelPdf(
      { ...base, shape: { shape: "rect", widthIn: 3, heightIn: 2 }, netMinIn: 1 / 8, logos: [{ bytes: png, kind: "png" }, { bytes: png, kind: "png" }] },
      await loadLabelFonts(),
    );
    expect(out.warnings).toEqual([]);
    const doc = await PDFDocument.load(out.bytes);
    const [front, back] = doc.getPages();
    expect(front!.node.Resources()?.lookupMaybe(PDFName.of("XObject"), PDFDict)?.keys().length).toBe(2);
    expect(back!.node.Resources()?.lookupMaybe(PDFName.of("XObject"), PDFDict)?.keys().length ?? 0).toBe(0);
  });

  it("still fits a logo on a 2 in round label", async () => {
    const { readFileSync } = await import("node:fs");
    const png = new Uint8Array(readFileSync("tests/fixtures/logo.png"));
    const out = await buildLabelPdf({ ...base, back: base.back.slice(1), shape: { shape: "round", diameterIn: 2 }, netMinIn: 1 / 16, logos: [{ bytes: png, kind: "png" }] }, await loadLabelFonts());
    expect(out.warnings).toEqual([]);
  });

  it("names the file Business_Product_Lot_Size_LabelSize, dashes inside each part", async () => {
    const { labelFileName } = await import("../lib/labelPdf");
    expect(
      labelFileName({ business: "Liminalia", product: "Relief Balm", size: "2 oz jar", lot: "2026-014", shape: { shape: "rect", widthIn: 3, heightIn: 2 } }),
    ).toBe("Liminalia_Relief-Balm_Lot-2026-014_2-oz-jar_3x2.pdf");
    expect(
      labelFileName({ business: "Hollow Pine Soap Co.", product: "Bee's Knees & Honey", size: "4 fl oz", shape: { shape: "round", diameterIn: 2.5 } }),
    ).toBe("Hollow-Pine-Soap-Co_Bees-Knees-and-Honey_4-fl-oz_2.5-round.pdf");
    expect(labelFileName({ business: "", product: "Balm", size: "1.5 oz tin" })).toBe("Balm_1.5-oz-tin.pdf");
  });
});

describe("warnings", () => {
  it("prints warnings in bold on the back", async () => {
    const caution = "Caution: For external use only. Avoid contact with eyes.";
    const out = await buildLabelPdf(
      { ...base, back: [ingredients, caution, ...base.back.slice(1)], boldBack: [caution], shape: { shape: "rect", widthIn: 3, heightIn: 2.5 }, netMinIn: 1 / 8 },
      await loadLabelFonts(),
    );
    expect(out.warnings).toEqual([]);
    expect(await fontNames(out.bytes)).toContain("Lato-Bold");
  });
});
