import type { Brand } from "./types";

/**
 * The product's name and words. This is the ONLY place the name appears.
 * Rebrand by editing these lines. Placeholder brand until the real one is set.
 */
export const brand: Brand = {
  name: "Verabatch",
  tagline: "Label drafts and batch records for small-batch makers.",
  description: "Label drafts and batch records for small-batch makers.",
  intro:
    "Type your recipe the way you make it. {name} does the conversions, suggests official ingredient names, drafts your label and keeps a record of every batch. You review and approve everything.",
  footer: "{name} is in early development. Check every label before you print.",
  disclaimerShort:
    "{name} is a drafting tool, not legal or regulatory advice. You're responsible for your labels and your business.",
  disclaimer: [
    {
      heading: "A tool, not advice",
      text: "{name} is software that helps you draft labels and keep batch records. It is not a law firm, a regulatory consultant or a government agency, and nothing in it is legal, regulatory, medical or safety advice.",
    },
    {
      heading: "No promise of compliance",
      text: "{name} does not promise or certify that any label, ingredient name, warning, claim, net contents statement or record meets FDA rules or any other law. We build the app around rules as we understand them, but rules change, and our reading of them may be wrong or incomplete.",
    },
    {
      heading: "Not connected to the FDA",
      text: "{name} is not affiliated with, endorsed by or approved by the U.S. Food and Drug Administration or any other agency.",
    },
    {
      heading: "Your products, your responsibility",
      text: "You are solely responsible for your products and your business: formulas, safety, testing, ingredient names, labels, warnings, claims, marketing, recalls, records, registrations and following every law that applies to you. Check every label yourself before you print or sell.",
    },
    {
      heading: "Ask a professional",
      text: "Before you sell, have your labels and products reviewed by a qualified professional, such as a regulatory consultant, an attorney or a cosmetic safety assessor. Recall alerts and supplier information in {name} may be incomplete or late; always follow the official notices from your suppliers and the agencies.",
    },
    {
      heading: "Limits",
      text: "You use {name} at your own risk. To the fullest extent the law allows, we are not liable for any loss, fine, recall, injury, claim or other harm connected to your products, your labels or your use of the app. The full terms of service will say more.",
    },
  ],
};

/** Fills {name} in brand text. */
export function brandText(text: string): string {
  return text.replaceAll("{name}", brand.name);
}

/** Page title in the form "Sign in · Verabatch". */
export function pageTitle(page?: string): string {
  return page ? `${page} · ${brand.name}` : brand.name;
}
