/**
 * The shapes behind the brand and the theme. You normally edit brand.ts and
 * the files in themes/, not this file.
 */

/** Words that name the product. Change these to rebrand; no other file mentions the name. */
export interface Brand {
  /** Product name, shown in the header, page titles and copy. */
  name: string;
  /** One line under the name on the home page. */
  tagline: string;
  /** Short description for search results and link previews. */
  description: string;
  /** Home page intro paragraph. */
  intro: string;
  /** Small print at the bottom of public pages. */
  footer: string;
  /** One-line disclaimer at the bottom of every page, linking to the full one. */
  disclaimerShort: string;
  /** The full disclaimer, one paragraph per entry, shown at /disclaimer. */
  disclaimer: { heading: string; text: string }[];
}

/** Every color the app uses. Screens only ever use these names, never raw colors. */
export interface ColorTokens {
  /** Page background. */
  paper: string;
  /** Cards, inputs, buttons. */
  surface: string;
  /** Recessed areas. */
  sunk: string;
  /** Main text. */
  ink: string;
  /** Secondary text, labels, hints. */
  muted: string;
  /** Borders and dividers. */
  line: string;
  /** Brand color: main buttons, links, focus rings, the logo mark. */
  accent: string;
  /** Darker accent for the pressable edge under big main buttons. */
  accentDeep: string;
  /** Pale accent for highlights and focus glow. */
  accentSoft: string;
  /** Text on top of the accent color (main button text). */
  onAccent: string;
  /** Warnings. */
  warn: string;
  warnSoft: string;
  /** Errors. */
  danger: string;
  /** Success messages like "Saved." */
  success: string;
  /** The sample label preview: paper, text and product-name color. */
  label: string;
  labelInk: string;
  labelAccent: string;
}

export interface FontToken {
  /** CSS font-family list, first choice first. */
  stack: string;
  /**
   * Google Fonts family spec to load, e.g. "Figtree:wght@400;600;700".
   * Leave out for fonts already on people's devices.
   */
  google?: string;
}

export interface Theme {
  /** Short id, used to pick the theme (THEME setting). */
  id: string;
  /** Human name, shown on the style guide page. */
  label: string;
  colors: { light: ColorTokens; dark: ColorTokens };
  fonts: {
    /** Headings and the product name. */
    display: FontToken;
    /** Everything else. */
    body: FontToken;
    /** Numbers, lot codes, amounts. */
    mono: FontToken;
  };
  /** Corner rounding. */
  radius: { card: string; control: string; small: string };
  /** Logo mark next to the name. */
  mark: "diamond" | "circle" | "square" | "none";
}
