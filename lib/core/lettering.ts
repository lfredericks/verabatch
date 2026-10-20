import type { LetteringStep } from "./types";

export type LabelShape =
  | { shape: "rect"; widthIn: number; heightIn: number }
  | { shape: "round"; diameterIn: number };

/** Front label area in square inches. */
export function labelArea(label: LabelShape): number {
  if (label.shape === "round") return (Math.PI * label.diameterIn ** 2) / 4;
  return label.widthIn * label.heightIn;
}

/**
 * Minimum net-contents letter height for a front panel of this area.
 * Spec: up to 5 sq in, 1/16 in; over 5 to 25, 1/8 in; over 25 to 100, 3/16 in; over 100 to 400, 1/4 in.
 */
export function minLetterHeight(areaSqIn: number, steps: LetteringStep[]): LetteringStep {
  const step = steps.find((s) => areaSqIn <= s.maxAreaSqIn);
  const last = steps[steps.length - 1];
  if (!step && !last) throw new Error("lettering table is empty");
  return (step ?? last) as LetteringStep;
}
