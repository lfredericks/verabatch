import type { CSSProperties } from "react";
import type { ColorTokens, Theme } from "@/lib/brand";

/**
 * Every text style the app uses, written out for the style guide page.
 * These mirror the rules in app/globals.css. When you change a size or weight
 * there, change it here too so the style guide stays true.
 */
export interface TypeStyle {
  name: string;
  /** Where it shows up. */
  use: string;
  /** Which theme font. */
  font: keyof Theme["fonts"];
  /** Size in rem (1rem = 16px). Two numbers = grows with the screen, smallest to largest. */
  rem: number | [number, number];
  weight: 400 | 500 | 600 | 700 | 800;
  /** Italic, all caps, letter spacing. */
  style?: string;
  lineHeight?: number;
  /** Text color token(s). */
  color: (keyof ColorTokens)[];
  /** Background it sits on, when it isn't the page. */
  on?: keyof ColorTokens;
  sample: string;
  /** Extra CSS for the live sample (sizes and spacing only; colors come from `color`). */
  css?: CSSProperties;
}

export const TYPE_SCALE: TypeStyle[] = [
  { name: "Wordmark", use: "Logo in the header", font: "display", rem: 1.9, weight: 400, style: "Letter spacing −0.02em", lineHeight: 1, color: ["accent", "ink"], sample: "verabatch" },
  { name: "Page title", use: "Top of every page (h1)", font: "display", rem: [2, 3], weight: 400, lineHeight: 1.1, color: ["ink"], sample: "Your label is ready" },
  { name: "Product title", use: "Product page header", font: "display", rem: [1.7, 2.4], weight: 400, lineHeight: 1.1, color: ["ink"], sample: "Midnight Garden" },
  { name: "Question", use: "One-question steps (onboarding, container picker)", font: "display", rem: 1.6, weight: 400, lineHeight: 1.15, color: ["ink"], sample: "What goes in it?" },
  { name: "Lead", use: "Intro line under a page title", font: "body", rem: 1.1, weight: 400, lineHeight: 1.5, color: ["muted"], sample: "Type your recipe the way you make it." },
  { name: "Body", use: "Everything else", font: "body", rem: 1, weight: 400, lineHeight: 1.5, color: ["ink"], sample: "Makes 4 jars. Pour at 140°F." },
  { name: "Section label", use: "Small headings above cards", font: "body", rem: 0.75, weight: 700, style: "ALL CAPS, letter spacing 0.08em", color: ["muted"], sample: "Recipe", css: { textTransform: "uppercase", letterSpacing: "0.08em" } },
  { name: "Tag", use: "Small markers like “Variation”", font: "body", rem: 0.75, weight: 700, style: "ALL CAPS, letter spacing 0.04em", color: ["accent"], sample: "Variation", css: { textTransform: "uppercase", letterSpacing: "0.04em" } },
  { name: "Field label", use: "Above inputs", font: "body", rem: 0.85, weight: 600, color: ["muted"], sample: "Shop name" },
  { name: "Hint", use: "Help text under fields", font: "body", rem: 0.9, weight: 400, color: ["muted"], sample: "Cups and spoons are approximate." },
  { name: "Error", use: "Something went wrong", font: "body", rem: 1, weight: 600, color: ["danger"], sample: "That code didn’t work." },
  { name: "Success", use: "Confirmations", font: "body", rem: 1, weight: 600, color: ["success"], sample: "Saved." },
  { name: "Link", use: "Text links (underlined)", font: "body", rem: 1, weight: 400, color: ["accent"], sample: "Read the full disclaimer", css: { textDecoration: "underline", textUnderlineOffset: 2 } },
  { name: "Button", use: "Regular buttons", font: "body", rem: 1, weight: 600, color: ["ink"], sample: "Edit" },
  { name: "Small button", use: "Copy, paste and other quiet actions", font: "body", rem: 0.9, weight: 600, color: ["ink"], sample: "Copy" },
  { name: "Big main button", use: "A screen’s one main action (text on plum)", font: "body", rem: 1.1, weight: 800, color: ["onAccent"], on: "accent", sample: "Save recipe" },
  { name: "Numbers", use: "Amounts, lot codes", font: "mono", rem: 1, weight: 400, color: ["ink"], sample: "12 oz · 340 g · Lot 2026-014" },
  { name: "Sign-in code", use: "Code entry box", font: "mono", rem: 1.4, weight: 400, style: "Letter spacing 0.2em", color: ["ink"], sample: "1234 5678", css: { letterSpacing: "0.2em" } },
  { name: "Disclaimer line", use: "Bottom of every page", font: "body", rem: 0.78, weight: 400, lineHeight: 1.45, color: ["muted"], sample: "A drafting tool, not legal advice." },
  { name: "Label name (preview)", use: "Product name on the on-screen label", font: "display", rem: 1.4, weight: 400, color: ["labelAccent"], on: "label", sample: "Midnight Garden" },
  { name: "Label text (preview)", use: "Everything else on the on-screen label", font: "body", rem: 0.9, weight: 400, lineHeight: 1.45, color: ["labelInk"], on: "label", sample: "Net wt 4 oz (113 g)" },
];

export const WEIGHT_NAMES: Record<number, string> = {
  100: "Thin", 200: "Extra Light", 300: "Light", 400: "Regular", 500: "Medium",
  600: "Semibold", 700: "Bold", 800: "Extra Bold", 900: "Black",
};

/** "1.1rem / 17.6px", or a range for sizes that grow with the screen. */
export function sizeText(rem: TypeStyle["rem"]): string {
  const px = (r: number) => `${Math.round(r * 16 * 10) / 10}px`;
  if (Array.isArray(rem)) return `${rem[0]}–${rem[1]}rem / ${px(rem[0])}–${px(rem[1])}`;
  return `${rem}rem / ${px(rem)}`;
}

/** The font's own name: the first family in the stack. */
export function fontName(stack: string): string {
  return (stack.split(",")[0] ?? stack).trim().replace(/^["']|["']$/g, "");
}

/** Weights a font loads, from its Google Fonts spec ("Figtree:wght@400;600;700"). */
export function loadedWeights(google?: string): number[] {
  if (!google) return [];
  const m = google.match(/wght@([\d;.]+)/);
  if (!m) return [400];
  return (m[1] ?? "400").split(";").map(Number);
}

/** Fonts on the printed label PDF (lib/labelPdf.ts). Fixed, not themed, so Canva can edit them. */
export const LABEL_PDF_FONTS = [
  { font: "Libre Baskerville", weight: 400, use: "Product name", size: "Sized to fit the front panel" },
  { font: "Arimo", weight: 400, use: "Product type, claims, ingredients, made-by line, lot", size: "One size for the whole back; never under 1/16 in (1/32 in on small containers)" },
  { font: "Arimo", weight: 700, use: "Net weight (ALL CAPS), warnings", size: "Net weight follows the FDA minimum for the front panel’s area" },
];
