import { writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { loadLabelFonts } from "../lib/labelFonts/load";
import { libraryCsv, sheetFileName, type LibraryRow, type SheetData } from "../lib/productSheet";
import { buildSheetPdf } from "../lib/productSheetPdf";

const row: LibraryRow = {
  id: "1",
  name: "Garden Balm",
  kind: "Salve or balm",
  identity: "Botanical Skin Balm",
  variationOf: "",
  sizes: "2 oz jar, 1 oz tin",
  ingredients: 5,
  makes: 5,
  batches: 2,
  lastMade: "2026-11-01",
  label: "Ready",
  claims: "Handmade · Small batch",
};

describe("product library CSV", () => {
  it("has a header row and one row per product, quoted", () => {
    const csv = libraryCsv([row]);
    expect(csv.startsWith("﻿\"Product\",\"Kind\"")).toBe(true);
    expect(csv).toContain('"Garden Balm","Salve or balm"');
  });
  it("defuses values that a spreadsheet would run as a formula", () => {
    expect(libraryCsv([{ ...row, name: "=HYPERLINK(1)" }])).toContain(`"'=HYPERLINK(1)"`);
  });
});

const sheet: SheetData = {
  kind: "internal",
  business: { name: "Moon Garden Co", place: "Anderson, IN 46011", contact: "moongarden.co" },
  name: "Garden Balm",
  identity: "Botanical Skin Balm",
  claims: "Handmade · Small batch",
  about: "A rich, slow-infused balm for dry hands and elbows.",
  sizes: [{ name: "2 oz jar", net: "Net Wt. 2 oz (56 g)" }],
  ingredients: "Ingredients: Organic Shea (Butyrospermum Parkii) Butter, Jojoba (Simmondsia Chinensis) Seed Oil, Beeswax, Tocopherol.",
  allergens: "Contains: beeswax (bee product).",
  warnings: ["Caution: For external use only. Keep out of reach of children and pets."],
  certifier: "",
  logo: null,
  recipe: [{ amount: "4 oz", ingredient: "shea butter", labelName: "Butyrospermum Parkii (Shea) Butter", pct: "50.0%", organic: true }],
  makes: 5,
  batchWeight: "about 8.0 oz (227 g)",
  batches: [{ lot: "GB-261101-1", madeOn: "2026-11-01", counts: "5 × 2 oz jar", changed: false }],
  variationOf: "",
  prepared: "November 5, 2026",
};

describe("product sheet PDF", () => {
  it("builds both versions", async () => {
    const fonts = await loadLabelFonts();
    for (const kind of ["buyer", "internal"] as const) {
      const bytes = await buildSheetPdf({ ...sheet, kind }, fonts, "Test");
      expect(bytes.length).toBeGreaterThan(5000);
      if (process.env.SHEET_OUT) writeFileSync(`${process.env.SHEET_OUT}/${kind}.pdf`, bytes);
    }
  });
  it("names the file like labels", () => {
    expect(sheetFileName(sheet)).toBe("Moon-Garden-Co_Garden-Balm_Internal-sheet.pdf");
  });
});
