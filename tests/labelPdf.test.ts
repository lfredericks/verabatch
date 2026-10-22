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

  it("letters meet the FDA minimums, measured on the lowercase o", async () => {
    // Lato's x-height is about 0.506 of the point size.
    const out = await buildLabelPdf({ ...base, shape: { shape: "rect", widthIn: 3, heightIn: 2 }, netMinIn: 1 / 8 }, await loadLabelFonts());
    expect(out.sizes.net * 0.506).toBeGreaterThanOrEqual(72 / 8);
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
