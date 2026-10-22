import { labelArea, minLetterHeight, type LabelShape } from "./core/lettering";
import { netContentsForSize, type FillUnit } from "./core/netContents";
import { parseAmount } from "./core/units";
import { findTemplate } from "./labelTemplates";
import type { LetteringStep } from "./core/types";

/** A size as stored. fill_amount stays as typed ("2", "1/2"). */
export interface Size {
  id: string;
  product_id: string;
  name: string;
  fill_amount: string;
  fill_unit: FillUnit;
  label_shape: "rect" | "round" | "oval";
  /** Label sheet it was picked from (Avery template number), if any. */
  label_template?: string | null;
  width_in: number | null;
  height_in: number | null;
  diameter_in: number | null;
}

export const FILL_UNITS: { key: FillUnit; label: string }[] = [
  { key: "oz", label: "oz (weight)" },
  { key: "floz", label: "fl oz (liquid)" },
  { key: "g", label: "g" },
  { key: "ml", label: "mL" },
];

/** Inches typed as "2", "2.5", "1 1/2" or "3/4". NaN if not a number. */
export function parseInches(text: string): number {
  return parseAmount(text.replace(/("|in|inches?)\s*$/i, "").trim());
}

export function labelShapeOf(s: Pick<Size, "label_shape" | "width_in" | "height_in" | "diameter_in">): LabelShape | null {
  if (s.label_shape === "round") return s.diameter_in ? { shape: "round", diameterIn: Number(s.diameter_in) } : null;
  if (s.label_shape === "oval")
    return s.width_in && s.height_in ? { shape: "oval", widthIn: Number(s.width_in), heightIn: Number(s.height_in) } : null;
  return s.width_in && s.height_in ? { shape: "rect", widthIn: Number(s.width_in), heightIn: Number(s.height_in) } : null;
}

export interface SizeFacts {
  /** "Net Wt. 2 oz (56 g)", or null if the fill amount isn't a number. */
  net: string | null;
  /** Front label area in square inches, or null without dimensions. */
  areaSqIn: number | null;
  lettering: LetteringStep | null;
  /** "2 in round" or "3 × 2 in". */
  labelText: string | null;
}

function inch(n: number): string {
  return String(Number(n.toFixed(3)));
}

export function sizeFacts(s: Size, steps: LetteringStep[]): SizeFacts {
  const fill = parseAmount(s.fill_amount);
  const net = fill > 0 ? netContentsForSize(fill, s.fill_unit) : null;
  const shape = labelShapeOf(s);
  const areaSqIn = shape ? labelArea(shape) : null;
  return {
    net,
    areaSqIn,
    lettering: areaSqIn ? minLetterHeight(areaSqIn, steps) : null,
    labelText: shape
      ? shape.shape === "round"
        ? `${inch(shape.diameterIn)} in round`
        : `${inch(shape.widthIn)} × ${inch(shape.heightIn)} in${shape.shape === "oval" ? " oval" : ""}`
      : null,
  };
}

/** Check and tidy a size from a form. Returns an error message or the row to save. */
export function readSizeForm(form: FormData):
  | { error: string }
  | { row: Omit<Size, "id" | "product_id">; id: string; productId: string } {
  const name = String(form.get("name") ?? "").trim();
  const fillAmount = String(form.get("fill_amount") ?? "").trim();
  const fillUnit = String(form.get("fill_unit") ?? "") as FillUnit;
  const rawShape = form.get("label_shape");
  const shape = rawShape === "round" ? "round" : rawShape === "oval" ? "oval" : "rect";
  const template = findTemplate(String(form.get("label_template") ?? ""));
  const w = parseInches(String(form.get("width_in") ?? ""));
  const h = parseInches(String(form.get("height_in") ?? ""));
  const d = parseInches(String(form.get("diameter_in") ?? ""));
  const ok = (n: number) => n > 0 && n <= 40;

  if (!name) return { error: "Give the size a name, like \"2 oz jar\"." };
  if (name.length > 60) return { error: "Keep the size name under 60 characters." };
  if (!(parseAmount(fillAmount) > 0) || fillAmount.length > 20) return { error: "Enter how much goes in one container, like 2." };
  if (!FILL_UNITS.some((u) => u.key === fillUnit)) return { error: "Pick a unit for the fill amount." };
  const dimsTyped = String(form.get(shape === "round" ? "diameter_in" : "width_in") ?? "").trim() !== "";
  if (shape === "round" && dimsTyped && !ok(d)) return { error: "Enter the label's width across in inches, like 2." };
  if (shape !== "round" && dimsTyped && !(ok(w) && ok(h))) return { error: "Enter the label's width and height in inches, like 3 and 2." };

  return {
    id: String(form.get("id") ?? ""),
    productId: String(form.get("product_id") ?? ""),
    row: {
      name,
      fill_amount: fillAmount,
      fill_unit: fillUnit,
      label_shape: shape,
      width_in: shape !== "round" && ok(w) && ok(h) ? w : null,
      height_in: shape !== "round" && ok(w) && ok(h) ? h : null,
      diameter_in: shape === "round" && ok(d) ? d : null,
      // Keep the sheet only if the label still matches it.
      label_template:
        template &&
        template.shape === shape &&
        (shape === "round" ? Math.abs(d - template.widthIn) < 0.01 : Math.abs(w - template.widthIn) < 0.01 && Math.abs(h - template.heightIn) < 0.01)
          ? template.id
          : null,
    },
  };
}
