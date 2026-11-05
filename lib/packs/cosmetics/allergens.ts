import type { ComputedRecipe } from "../../core";
import type { AllergenGroup } from "../../core/types";

/**
 * Common allergens makers use, found by name in a recipe. US cosmetic labels don't require
 * an allergen statement (Nov 2026); FDA plans to propose a fragrance-allergen labeling rule
 * under MoCRA, whose list isn't out yet. This list covers food-style allergens that show
 * up in body care. Coconut is its own group: FDA no longer counts it as a tree nut (2025).
 */
export const ALLERGEN_GROUPS: AllergenGroup[] = [
  {
    key: "tree-nut",
    label: "tree nut",
    re: /almond|prunus amygdalus|macadamia|hazelnut|corylus|walnut|juglans|pecan|carya|brazil nut|bertholletia|cashew|anacardium|pistachio|pistacia vera|argan|argania|kukui|aleurites|\bpili\b|canarium/,
  },
  { key: "peanut", label: "peanut", re: /peanut|arachis/ },
  { key: "coconut", label: "coconut", re: /coconut|cocos nucifera/ },
  { key: "wheat", label: "wheat", re: /wheat|triticum/ },
  { key: "oat", label: "oat", re: /\boats?\b|oatmeal|avena/ },
  { key: "soy", label: "soy", re: /\bsoy|soybean|glycine soja|glycine max/ },
  { key: "sesame", label: "sesame", re: /sesame|sesamum/ },
  { key: "milk", label: "milk", re: /\bmilk\b(?! thistle)|buttermilk|casein|whey|lactis|lac\b/ },
  { key: "egg", label: "egg", re: /\beggs?\b|\bovum\b/ },
  { key: "wool", label: "wool", re: /lanolin|wool wax|adeps lanae/ },
  { key: "bee", label: "bee product", re: /beeswax|cera alba|propolis|royal jelly|honey|\bmel\b/ },
];

/** Essential oils naturally contain fragrance allergens (linalool, limonene, geraniol...). */
export const ESSENTIAL_OIL = /(essential oil|\beo\b|fragrance|parfum|absolute|lavandula|mentha|citrus|eucalyptus|melaleuca|rosmarinus|pelargonium|cymbopogon|cedrus|santalum|rosa damascena|matricaria|chamaemelum)/;

export function lineWords(l: ComputedRecipe["lines"][number]): string {
  const r = l.resolution;
  const names = r.status === "known" ? (r.parts ? r.parts.map((p) => p.labelName) : [r.labelName]) : [];
  return `${l.line.text} ${names.join(" ")}`.toLowerCase();
}
