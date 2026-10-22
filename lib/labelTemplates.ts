/**
 * Ready-made label sheets makers buy (Avery first). Picking one fills in a size's label
 * shape and dimensions, and keeps the sheet layout for printing whole sheets later
 * (printer profiles).
 *
 * Every layout here was measured from Avery's own blank template PDF (the cut lines),
 * on Oct 22, 2026. Third-party template sites disagreed with Avery by up to 3 mm, so
 * only add a template from the maker's own file. Positions are in points (1/72 in),
 * measured from the sheet's top-left corner to each label's top-left corner.
 */

export type TemplateShape = "rect" | "round" | "oval";

export interface LabelTemplate {
  /** The template number Avery prints on the box and uses on its site. */
  id: string;
  brand: "Avery";
  shape: TemplateShape;
  widthIn: number;
  heightIn: number;
  /** Plain description, like "2 in round, 12 per sheet". */
  label: string;
  /** Other product numbers that Avery's own site maps to this same template file. */
  alsoFits: string[];
  sheet: "letter";
  /** Left edge of each column, in points from the sheet's left edge. */
  colsPt: number[];
  /** Top edge of each row, in points from the sheet's top edge. */
  rowsPt: number[];
  /** Avery's template file the layout was measured from. */
  source: string;
}

const t = (x: Omit<LabelTemplate, "brand" | "sheet" | "label"> & { label?: string }): LabelTemplate => {
  const per = x.colsPt.length * x.rowsPt.length;
  const size =
    x.shape === "round" ? `${x.widthIn} in round` : `${x.widthIn} × ${x.heightIn} in${x.shape === "oval" ? " oval" : ""}`;
  return { brand: "Avery", sheet: "letter", label: x.label ?? `${size}, ${per} per sheet`, ...x };
};

export const LABEL_TEMPLATES: LabelTemplate[] = [
  // ---- Round ----
  t({ id: "22807", shape: "round", widthIn: 2, heightIn: 2, alsoFits: ["22817", "22825", "22877", "5907", "80510", "4227", "22205", "22612", "22921", "22923", "22933", "22961", "41464", "41494", "92111", "92807", "94501"], colsPt: [45, 234, 423], rowsPt: [45, 230.95, 416.95, 602.95], source: "U-0435-01.pdf" }),
  t({ id: "22808", shape: "round", widthIn: 2.5, heightIn: 2.5, alsoFits: ["22830", "22856"], colsPt: [22.5, 216.05, 409.6], rowsPt: [45, 306, 567], source: "U-0436-01.pdf" }),
  t({ id: "6450", shape: "round", widthIn: 1, heightIn: 1, alsoFits: [], colsPt: [36, 113.95, 191.95, 269.95, 347.95, 425.95, 503.95], rowsPt: [36, 117, 198, 279, 360, 441, 522, 603, 684], source: "U-0514-01.pdf" }),

  // ---- Square ----
  t({ id: "22806", shape: "rect", widthIn: 2, heightIn: 2, label: "2 × 2 in square, 12 per sheet", alsoFits: ["22816", "22853", "64503", "64510", "5908"], colsPt: [45, 234, 423], rowsPt: [45, 230.95, 416.95, 602.95], source: "U-0431-01.pdf" }),
  t({ id: "22805", shape: "rect", widthIn: 1.5, heightIn: 1.5, label: "1.5 × 1.5 in square, 24 per sheet", alsoFits: [], colsPt: [56.15, 186.7, 317.25, 447.8], rowsPt: [36, 158.4, 280.8, 403.2, 525.6, 648], source: "U-0430-01.pdf" }),

  // ---- Oval ----
  t({ id: "22804", shape: "oval", widthIn: 2.5, heightIn: 1.5, alsoFits: ["22206", "22564", "22814", "22854"], colsPt: [26.6, 216, 405.35], rowsPt: [45.35, 164, 282.65, 401.3, 519.95, 638.6], source: "U-0428-01.pdf" }),
  t({ id: "6583", shape: "oval", widthIn: 2.5, heightIn: 1.5, alsoFits: [], colsPt: [23.4, 216, 408.6], rowsPt: [36, 158.4, 280.8, 403.2, 525.6, 648], source: "U-0429-01.pdf" }),
  t({ id: "22820", shape: "oval", widthIn: 3.333, heightIn: 2, label: "3 1/3 × 2 in oval, 8 per sheet", alsoFits: ["22829"], colsPt: [54, 317.95], rowsPt: [72, 239.95, 407.95, 575.95], source: "U-0488-01.pdf" }),
  t({ id: "8216", shape: "oval", widthIn: 2.25, heightIn: 1.125, label: "2 1/4 × 1 1/8 in oval, 21 per sheet", alsoFits: ["80502"], colsPt: [31.5, 225, 418.5], rowsPt: [45, 148.5, 252, 355.5, 459, 562.5, 666], source: "U-0541-01.pdf" }),

  // ---- Rectangle ----
  t({ id: "22822", shape: "rect", widthIn: 3, heightIn: 2, alsoFits: [], colsPt: [61.2, 334.8], rowsPt: [94.5, 247.5, 400.5, 553.5], source: "U-0489-01.pdf" }),
  t({ id: "5163", shape: "rect", widthIn: 4, heightIn: 2, alsoFits: [], colsPt: [11.2, 312.75], rowsPt: [36, 180, 324, 468, 612], source: "U-0090-01.pdf" }),
  t({ id: "5164", shape: "rect", widthIn: 4, heightIn: 3.333, label: "4 × 3 1/3 in, 6 per sheet", alsoFits: [], colsPt: [11.2, 312.75], rowsPt: [36, 275.95, 515.95], source: "U-0091-01.pdf" }),
  t({ id: "5162", shape: "rect", widthIn: 4, heightIn: 1.333, label: "4 × 1 1/3 in, 14 per sheet", alsoFits: [], colsPt: [11.2, 312.7], rowsPt: [59.95, 155.95, 251.95, 347.95, 443.95, 539.95, 635.95], source: "U-0089-01.pdf" }),
  t({ id: "5160", shape: "rect", widthIn: 2.625, heightIn: 1, label: "2 5/8 × 1 in, 30 per sheet", alsoFits: [], colsPt: [13.5, 211.5, 409.5], rowsPt: [36, 108, 180, 252, 324, 396, 468, 540, 612, 684], source: "U-0087-01.pdf" }),
  t({ id: "5168", shape: "rect", widthIn: 3.5, heightIn: 5, alsoFits: [], colsPt: [36, 324], rowsPt: [36, 396], source: "U-0094-01.pdf" }),
];

/** Find a template by its own number or any product number that shares its layout. */
export function findTemplate(number: string | null | undefined): LabelTemplate | null {
  const n = String(number ?? "").replace(/[^0-9.]/g, "");
  if (!n) return null;
  return LABEL_TEMPLATES.find((x) => x.id === n || x.alsoFits.includes(n)) ?? null;
}

export const perSheet = (x: LabelTemplate) => x.colsPt.length * x.rowsPt.length;
