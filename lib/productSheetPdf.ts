import * as fontkitModule from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFImage, type PDFPage, type RGB } from "pdf-lib";
import { activeTheme } from "./brand";
import type { LabelFontFiles } from "./labelPdf";
import type { SheetData } from "./productSheet";

const fontkit = ((fontkitModule as unknown as { default?: typeof fontkitModule }).default ?? fontkitModule) as typeof fontkitModule;

/** US Letter, 3/4 in margins. */
const W = 612;
const H = 792;
const M = 54;

function hex(c: string): RGB {
  const n = parseInt(c.replace("#", ""), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

/** A page writer: flows text top to bottom and starts a new page when one fills. */
class Flow {
  page!: PDFPage;
  y = 0;
  constructor(
    private pdf: PDFDocument,
    private footer: string,
    private f: { serif: PDFFont; sans: PDFFont; bold: PDFFont },
    private c: { ink: RGB; muted: RGB; accent: RGB; line: RGB; soft: RGB },
  ) {
    this.newPage();
  }
  newPage() {
    this.page = this.pdf.addPage([W, H]);
    this.y = H - M;
    this.page.drawText(this.footer, { x: M, y: 30, size: 8, font: this.f.sans, color: this.c.muted });
  }
  need(h: number) {
    if (this.y - h < M) this.newPage();
  }
  /** Lines of text that fit `width` at this font and size. */
  wrap(text: string, font: PDFFont, size: number, width: number): string[] {
    const out: string[] = [];
    for (const para of text.split("\n")) {
      let line = "";
      for (const word of para.split(/\s+/).filter(Boolean)) {
        const t = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(t, size) <= width || !line) line = t;
        else {
          out.push(line);
          line = word;
        }
      }
      out.push(line);
    }
    return out;
  }
  text(text: string, o: { font?: PDFFont; size?: number; color?: RGB; x?: number; width?: number; gap?: number } = {}) {
    const font = o.font ?? this.f.sans;
    const size = o.size ?? 10;
    const x = o.x ?? M;
    const lead = size * 1.35;
    for (const l of this.wrap(text, font, size, o.width ?? W - M - x)) {
      this.need(lead);
      this.y -= lead;
      this.page.drawText(l, { x, y: this.y + size * 0.25, size, font, color: o.color ?? this.c.ink });
    }
    this.y -= o.gap ?? 0;
  }
  heading(t: string) {
    this.need(40);
    this.y -= 14;
    this.text(t.toUpperCase(), { font: this.f.bold, size: 8.5, color: this.c.accent, gap: 4 });
  }
  rule() {
    this.page.drawLine({ start: { x: M, y: this.y }, end: { x: W - M, y: this.y }, thickness: 0.6, color: this.c.line });
  }
  /** A simple table: column widths in points, header row in bold, rows wrapped. */
  table(cols: { label: string; w: number }[], rows: string[][]) {
    const size = 9;
    const lead = size * 1.35;
    const drawRow = (cells: string[], font: PDFFont, color: RGB) => {
      const wrapped = cells.map((c, i) => this.wrap(c, font, size, cols[i]!.w - 8));
      const h = Math.max(...wrapped.map((w) => w.length)) * lead + 6;
      this.need(h);
      let x = M;
      wrapped.forEach((ls, i) => {
        ls.forEach((l, j) => this.page.drawText(l, { x: x + 2, y: this.y - 4 - (j + 1) * lead + size * 0.3, size, font, color }));
        x += cols[i]!.w;
      });
      this.y -= h;
      this.rule();
    };
    drawRow(cols.map((c) => c.label), this.f.bold, this.c.muted);
    for (const r of rows) drawRow(r, this.f.sans, this.c.ink);
  }
  image(img: PDFImage, maxW: number, maxH: number) {
    const s = Math.min(maxW / img.width, maxH / img.height);
    const w = img.width * s;
    const h = img.height * s;
    this.page.drawImage(img, { x: M, y: this.y - h, width: w, height: h });
    return h;
  }
}

/** A product sheet as a one-to-two page Letter PDF, in the label fonts. */
export async function buildSheetPdf(d: SheetData, files: LabelFontFiles, title: string): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  pdf.setTitle(title);
  pdf.setCreator("Product sheet");
  const f = {
    serif: await pdf.embedFont(files.serif, { subset: true }),
    sans: await pdf.embedFont(files.sans, { subset: true }),
    bold: await pdf.embedFont(files.sansBold, { subset: true }),
  };
  const t = activeTheme().colors.light;
  const c = { ink: hex(t.ink), muted: hex(t.muted), accent: hex(t.accent), line: hex(t.line), soft: hex(t.accentSoft) };
  const internal = d.kind === "internal";
  const footer = `${d.business.name || "Product sheet"} · ${internal ? "Internal: not for sharing" : "Product information"} · Prepared ${d.prepared}`;
  const flow = new Flow(pdf, footer, f, c);

  // Header: logo, then the business on the right.
  if (d.logo) {
    try {
      const img = d.logo.kind === "png" ? await pdf.embedPng(d.logo.bytes) : await pdf.embedJpg(d.logo.bytes);
      const h = flow.image(img, 140, 60);
      flow.y -= h + 10;
    } catch {
      // A logo that won't embed is left off; the sheet still works.
    }
  }
  if (internal) {
    flow.page.drawRectangle({ x: W - M - 150, y: H - M - 18, width: 150, height: 18, color: c.soft });
    flow.page.drawText("INTERNAL · NOT FOR SHARING", { x: W - M - 142, y: H - M - 12.5, size: 7.5, font: f.bold, color: c.accent });
  }
  flow.text(d.name, { font: f.serif, size: 24, gap: 2 });
  if (d.identity) flow.text(d.identity, { size: 12, color: c.muted });
  if (d.claims) flow.text(d.claims, { font: f.bold, size: 10, color: c.accent });
  if (internal && d.variationOf) flow.text(`Variation of ${d.variationOf}`, { size: 9.5, color: c.muted });
  flow.y -= 6;
  flow.rule();

  if (!internal && d.about) {
    flow.heading("About");
    flow.text(d.about, { size: 10 });
  }

  if (d.sizes.length) {
    flow.heading("Sizes");
    flow.table(
      [
        { label: "Size", w: 260 },
        { label: "Net contents", w: W - 2 * M - 260 },
      ],
      d.sizes.map((s) => [s.name, s.net]),
    );
  }

  if (internal) {
    flow.heading("Recipe");
    flow.table(
      [
        { label: "Amount", w: 72 },
        { label: "Ingredient", w: 140 },
        { label: "Label name", w: 196 },
        { label: "By weight", w: 52 },
        { label: "Organic", w: W - 2 * M - 460 },
      ],
      d.recipe.map((r) => [r.amount, r.ingredient, r.labelName, r.pct, r.organic ? "Yes" : ""]),
    );
    const totals = [d.batchWeight && `Batch: ${d.batchWeight}`, d.makes ? `makes ${d.makes}` : ""].filter(Boolean).join(", ");
    if (totals) {
      flow.y -= 4;
      flow.text(totals, { size: 9, color: c.muted });
    }
  }

  flow.heading("Ingredients");
  flow.text(d.ingredients.replace(/^Ingredients:\s*/, "") || "Add the recipe to list the ingredients.", { size: 10 });
  if (d.allergens) {
    flow.heading("Allergens");
    flow.text(d.allergens, { size: 10 });
  }
  if (d.warnings.length) {
    flow.heading("Warnings");
    for (const w of d.warnings) flow.text(w, { size: 10, gap: 2 });
  }
  if (d.certifier) {
    flow.heading("Organic");
    flow.text(d.certifier, { size: 10 });
  }

  if (internal) {
    flow.heading("Batches");
    if (d.batches.length)
      flow.table(
        [
          { label: "Lot", w: 110 },
          { label: "Made", w: 90 },
          { label: "Made how many", w: 230 },
          { label: "Recipe", w: W - 2 * M - 430 },
        ],
        d.batches.map((b) => [b.lot, b.madeOn, b.counts, b.changed ? "Changed" : "Usual"]),
      );
    else flow.text("No batches logged yet.", { size: 10, color: c.muted });
  }

  flow.heading("Made by");
  flow.text([d.business.name, d.business.place, d.business.contact].filter(Boolean).join("\n") || "Add your business details.", { size: 10 });

  return pdf.save();
}
