import * as fontkitModule from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { LabelShape } from "./core/lettering";

/**
 * The label as a print-ready PDF: page 1 is the front, page 2 the back, each at the
 * label's exact size. Built for importing into Canva (or any label app):
 *
 * - Only two font families, both in Canva's standard font list, so they come across
 *   as editable text: Libre Baskerville for the product name, Lato for everything else.
 * - Each part of the label (name, what it is, net weight, ingredients, made-by line, lot)
 *   is one paragraph with one font and one size, so it imports as one text box.
 * - Letter sizes are measured the FDA way, on the lowercase "o" (x-height), never below
 *   the minimums: net weight from the front panel's area, ingredients 1/16 in.
 */

// The font reader ships as one bundled object; bundlers expose it as the default export.
const fontkit = ((fontkitModule as unknown as { default?: typeof fontkitModule }).default ?? fontkitModule) as typeof fontkitModule;

export const LABEL_FONT_FAMILIES = ["Libre Baskerville", "Lato"] as const;

export interface LabelFontFiles {
  /** Libre Baskerville Regular: the product name. */
  serif: Uint8Array;
  /** Lato Regular: everything else. */
  sans: Uint8Array;
  /** Lato Bold: the net weight. */
  sansBold: Uint8Array;
}

export interface LabelPdfInput {
  shape: LabelShape;
  name: string;
  identity: string;
  net: string | null;
  /** Smallest net-weight letter height for this front panel, in inches. */
  netMinIn: number;
  /** Back panel paragraphs: ingredients, made-by line, questions line, lot. */
  back: string[];
  title: string;
  /** Logos for the top of the front (product, business, or both side by side). PNG or JPG bytes. */
  logos?: { bytes: Uint8Array; kind: "png" | "jpg" }[];
  /** Back paragraphs printed in bold (warnings: FDA wants them conspicuous). */
  boldBack?: string[];
}

export interface LabelPdf {
  bytes: Uint8Array;
  /** Things the maker should know: text that had to go small, or doesn't fit. */
  warnings: string[];
  /** Point sizes used, for checking. */
  sizes: { name: number; identity: number; net: number; back: number };
}

const PT = 72;
/** FDA ingredient letters: 1/16 in, or 1/32 in when the whole package has under 12 sq in for labels. */
const ING_MIN_IN = 1 / 16;
const ING_SMALL_PACKAGE_IN = 1 / 32;
const LEADING = 1.22;

interface Para {
  text: string;
  font: PDFFont;
  size: number;
  /** Space above this paragraph, in points. */
  gap: number;
}

interface PlacedLine {
  text: string;
  font: PDFFont;
  size: number;
  /** Left edge, from the page's left. */
  x: number;
  /** Top of the line band, from the page's top. */
  top: number;
}

interface Frame {
  W: number;
  H: number;
  /** Usable left/right edges for a band of the page (measured from the top), or null if none. */
  across(top: number, bottom: number): [number, number] | null;
  /** Inner top and bottom limits. */
  top: number;
  bottom: number;
}

function frameFor(shape: LabelShape): Frame {
  if (shape.shape === "rect") {
    const W = shape.widthIn * PT;
    const H = shape.heightIn * PT;
    const m = Math.min(0.1 * PT, Math.min(W, H) * 0.08);
    return { W, H, top: m, bottom: H - m, across: () => [m, W - m] };
  }
  const D = shape.diameterIn * PT;
  const r = D / 2;
  const inner = r - Math.min(0.1 * PT, D * 0.06);
  return {
    W: D,
    H: D,
    top: r - inner,
    bottom: r + inner,
    across(top, bottom) {
      const dy = Math.max(Math.abs(top - r), Math.abs(bottom - r));
      if (dy >= inner) return null;
      const half = Math.sqrt(inner * inner - dy * dy);
      return [r - half, r + half];
    },
  };
}

const NBSP = "\u00a0";

/** Never split "2 oz", "56 g", "(56 g)" or "Net Wt." from its number across lines. */
export function keepTogether(text: string): string {
  return text
    .replace(/\(([^()]{1,12})\)/g, (m) => m.replace(/ /g, NBSP))
    .replace(/(\d) (?=(fl\.? oz|oz|g|mL|ml|L|lb)\b)/g, `$1${NBSP}`)
    .replace(/\b(fl\.?) (?=oz\b)/g, `$1${NBSP}`)
    .replace(/\bNet (?=(Wt|Vol)\.)/g, `Net${NBSP}`)
    .replace(/\b(Wt\.|Vol\.|Net) (?=\d)/g, `$1${NBSP}`);
}

/** Lay paragraphs out from `start` downwards. Every line is wrapped to the width at its own height. */
function flow(paras: Para[], frame: Frame, start: number, align: "center" | "left") {
  const lines: PlacedLine[] = [];
  let y = start;
  let overflow = false;
  for (const p of paras) {
    y += p.gap;
    const lh = p.size * LEADING;
    const words = keepTogether(p.text).split(/[ \t\r\n]+/).filter(Boolean);
    let i = 0;
    while (i < words.length) {
      const span = frame.across(y, y + lh);
      if (!span) {
        overflow = true;
        break;
      }
      const [l, r] = span;
      const max = r - l;
      let line = words[i]!;
      i++;
      while (i < words.length && p.font.widthOfTextAtSize(`${line} ${words[i]}`, p.size) <= max) {
        line = `${line} ${words[i]}`;
        i++;
      }
      const w = p.font.widthOfTextAtSize(line, p.size);
      if (w > max + 0.01) overflow = true;
      lines.push({ text: line, font: p.font, size: p.size, x: align === "center" ? l + (max - w) / 2 : l, top: y });
      y += lh;
    }
    if (overflow) break;
  }
  return { lines, end: y, overflow };
}

/** Center paragraphs between `top` and `bottom`. Round labels need a few passes, since width depends on height. */
function centerIn(paras: Para[], frame: Frame, top: number, bottom: number, align: "center" | "left") {
  // First guess at the height: as if every line had the widest width.
  const mid = (top + bottom) / 2;
  const widest = frame.across(mid, mid) ?? [0, frame.W];
  const flat: Frame = { ...frame, across: () => widest };
  const guess = flow(paras, flat, 0, align).end;
  let start = Math.max(top, mid - guess / 2);
  let out = flow(paras, frame, start, align);
  for (let pass = 0; pass < 6 && !out.overflow; pass++) {
    const next = mid - (out.end - start) / 2;
    if (next < top - 0.01) return { ...out, fits: false };
    if (Math.abs(next - start) < 0.25) break;
    start = next;
    out = flow(paras, frame, start, align);
  }
  return { ...out, fits: !out.overflow && start >= top - 0.01 && out.end <= bottom + 0.01 };
}

function draw(page: PDFPage, H: number, lines: PlacedLine[]) {
  for (const l of lines) {
    // Baseline sits inside the band: ascent of roughly 0.8 em below the band's top, plus half the leading.
    const baseline = l.top + l.size * (LEADING - 1) / 2 + l.size * 0.8;
    page.drawText(l.text, { x: l.x, y: H - baseline, size: l.size, font: l.font, color: rgb(0, 0, 0), lineHeight: l.size * LEADING });
  }
}

function xHeightRatio(bytes: Uint8Array): number {
  const f = fontkit.create(bytes);
  return f.xHeight / f.unitsPerEm;
}

/** Point size whose lowercase "o" is at least `inches` tall, rounded up to a tenth. */
function sizeForXHeight(inches: number, ratio: number): number {
  return Math.ceil(((inches * PT) / ratio) * 10) / 10;
}

export async function buildLabelPdf(input: LabelPdfInput, files: LabelFontFiles): Promise<LabelPdf> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  pdf.setTitle(input.title);
  pdf.setCreator("Label PDF");
  // Standard subset names ("ABCDEF+Lato-Regular"), so apps like Canva see the real font name.
  const serif = await pdf.embedFont(files.serif, { subset: true, customName: "VBLAAA+LibreBaskerville-Regular" });
  const sans = await pdf.embedFont(files.sans, { subset: true, customName: "VBLAAB+Lato-Regular" });
  const sansBold = await pdf.embedFont(files.sansBold, { subset: true, customName: "VBLAAC+Lato-Bold" });
  const xSans = xHeightRatio(files.sans);
  const xBold = xHeightRatio(files.sansBold);

  const frame = frameFor(input.shape);
  const { W, H } = frame;
  const short = Math.min(W, H);
  const warnings: string[] = [];

  // ---- Front ----
  const front = pdf.addPage([W, H]);
  // Net weight: a hair over the legal minimum, in the bottom 30% of the panel.
  const netSize = sizeForXHeight(input.netMinIn * 1.05, xBold);
  let netTop = frame.bottom;
  if (input.net) {
    const netPara: Para[] = [{ text: input.net, font: sansBold, size: netSize, gap: 0 }];
    let placed: ReturnType<typeof flow> | null = null;
    // Start as low as possible and move up until it fits the shape (round labels narrow at the bottom).
    for (let start = frame.bottom - netSize * LEADING; start >= H * 0.7 - 0.01; start -= 1) {
      const tried = flow(netPara, frame, start, "center");
      if (!tried.overflow && tried.end <= frame.bottom + 0.01) {
        placed = tried;
        netTop = start;
        break;
      }
    }
    if (!placed) {
      // Doesn't fit in the bottom 30%: still print it at legal size, and say so.
      placed = flow(netPara, frame, H * 0.7, "center");
      netTop = H * 0.7;
      warnings.push("The net weight doesn't fit in the bottom 30% of the front at the legal letter size. Use a bigger label.");
    }
    draw(front, H, placed.lines);
  }

  // Logo (if any) at the top, then the name and "what it is", as big as fits above the net weight.
  const regionBottom = input.net ? netTop - netSize * 0.6 : frame.bottom;
  const logoImgs = await Promise.all(
    (input.logos ?? []).slice(0, 2).map((l) => (l.kind === "png" ? pdf.embedPng(l.bytes) : pdf.embedJpg(l.bytes))),
  );
  const logo = logoImgs.length > 0;
  const nameBase = short * 0.17;
  let nameSize = nameBase;
  let identitySize = nameBase * 0.5;

  /** The name block between `top` and the net weight, shrinking no further than `minScale`. */
  const fitName = (top: number, minScale: number) => {
    for (let s = 1; s >= minScale - 0.001; s -= 0.025) {
      nameSize = Math.round(nameBase * s * 10) / 10;
      identitySize = Math.max(6, Math.round(nameBase * 0.5 * Math.max(s, 0.6) * 10) / 10);
      const paras: Para[] = [{ text: input.name, font: serif, size: nameSize, gap: 0 }];
      if (input.identity.trim()) paras.push({ text: input.identity, font: sans, size: identitySize, gap: identitySize * 0.35 });
      const out = centerIn(paras, frame, top, regionBottom, "center");
      if (out.fits) return out;
    }
    return null;
  };

  /** Where the logos fit at this share of the label's height: side by side, as high as the shape allows. */
  const placeLogo = (frac: number) => {
    if (!logo) return null;
    const gap = short * 0.05;
    let h = H * frac;
    // Same height for each logo; total width no more than 80% (70% for one logo).
    const ratio = logoImgs.reduce((sum, img) => sum + img.width / img.height, 0);
    const maxW = W * (logoImgs.length > 1 ? 0.8 : 0.7) - gap * (logoImgs.length - 1);
    if (ratio * h > maxW) h = maxW / ratio;
    const w = ratio * h + gap * (logoImgs.length - 1);
    for (let y = frame.top; y + h < regionBottom; y += 1) {
      const span = frame.across(y, y + h);
      if (span && span[1] - span[0] >= w) return { x: (W - w) / 2, y, w, h, gap };
    }
    return null;
  };

  const logoSteps = logo ? [0.3, 0.24, 0.18, 0.13] : [0];
  let frontDone = false;
  for (let i = 0; i < logoSteps.length && !frontDone; i++) {
    const last = i === logoSteps.length - 1;
    const box = placeLogo(logoSteps[i]!);
    if (logo && !box) continue;
    const textTop = box ? box.y + box.h + short * 0.04 : frame.top;
    const out = fitName(textTop, last ? 0.25 : 0.55);
    if (!out) continue;
    if (box) {
      let x = box.x;
      for (const img of logoImgs) {
        const w = (img.width / img.height) * box.h;
        front.drawImage(img, { x, y: H - box.y - box.h, width: w, height: box.h });
        x += w + box.gap;
      }
    }
    draw(front, H, out.lines);
    frontDone = true;
  }
  if (!frontDone) {
    warnings.push(
      logo
        ? "The logo and name don't fit on the front together. Shorten the name, use a wider logo, or use a bigger label."
        : "The name doesn't fit on the front. Shorten it or use a bigger label.",
    );
    const paras: Para[] = [{ text: input.name, font: serif, size: nameSize, gap: 0 }];
    if (input.identity.trim()) paras.push({ text: input.identity, font: sans, size: identitySize, gap: 2 });
    draw(front, H, flow(paras, frame, frame.top, "center").lines);
  }

  // ---- Back ----
  const backPage = pdf.addPage([W, H]);
  const align = input.shape.shape === "round" ? "center" : "left";
  const minBack = sizeForXHeight(ING_MIN_IN, xSans);
  const smallBack = sizeForXHeight(ING_SMALL_PACKAGE_IN, xSans);
  const backParas = (size: number): Para[] =>
    input.back
      .filter((t) => t.trim())
      .map((text, i) => ({ text, font: input.boldBack?.includes(text) ? sansBold : sans, size, gap: i === 0 ? 0 : size * 0.45 }));
  const tryBack = (size: number) => centerIn(backParas(size), frame, frame.top, frame.bottom, align);

  let backSize = minBack;
  let back = tryBack(minBack);
  if (back.fits) {
    // Room to spare: grow up to a comfortable reading size.
    for (let s = Math.max(minBack, short * 0.075); s > minBack; s -= 0.25) {
      const tried = tryBack(s);
      if (tried.fits) {
        back = tried;
        backSize = s;
        break;
      }
    }
  } else {
    for (let s = minBack - 0.1; s >= smallBack - 0.001; s -= 0.1) {
      const tried = tryBack(Math.round(s * 10) / 10);
      backSize = Math.round(s * 10) / 10;
      back = tried;
      if (tried.fits) break;
    }
    if (back.fits) {
      warnings.push(
        "The back only fits with ingredient letters under 1/16 in. That's allowed only if the whole container has less than 12 sq in of room for labels. Otherwise use a bigger back label.",
      );
    } else {
      warnings.push("The back text doesn't fit on this label, even at the smallest allowed letter size. Use a bigger back label.");
    }
  }
  draw(backPage, H, back.lines);

  const bytes = await pdf.save();
  return {
    bytes,
    warnings,
    sizes: { name: nameSize, identity: identitySize, net: input.net ? netSize : 0, back: backSize },
  };
}

/**
 * File name for a label PDF (also the design's name once it's in Canva):
 * "Business - Product - Size.pdf", plus " - Lot X" for a batch label.
 */
export function labelFileName(parts: { business: string; product: string; size: string; lot?: string | null }): string {
  const clean = (t: string) => t.replace(/[\\/:*?"<>|\u0000-\u001f]+/g, " ").replace(/\s+/g, " ").trim();
  const name = [parts.business, parts.product, parts.size, parts.lot ? `Lot ${parts.lot}` : ""]
    .map(clean)
    .filter(Boolean)
    .join(" - ")
    .slice(0, 150)
    .trim();
  return `${name || "Label"}.pdf`;
}
