import type { Brand } from "./types";

/**
 * The product's name and words. This is the ONLY place the name appears.
 * Rebrand by editing these lines. Placeholder brand until the real one is set.
 */
export const brand: Brand = {
  name: "Verabatch",
  tagline: "Correct labels for small-batch makers.",
  description: "Correct labels and batch records for small-batch makers.",
  intro:
    "Type your recipe the way you make it. {name} does the conversions, the official ingredient names and the label rules, and keeps a record of every batch.",
  footer: "{name} is in early development. Sample only; check every label before you print.",
};

/** Fills {name} in brand text. */
export function brandText(text: string): string {
  return text.replaceAll("{name}", brand.name);
}

/** Page title in the form "Sign in · Verabatch". */
export function pageTitle(page?: string): string {
  return page ? `${page} · ${brand.name}` : brand.name;
}
