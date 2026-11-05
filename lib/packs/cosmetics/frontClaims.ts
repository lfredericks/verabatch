import type { ComputedRecipe } from "../../core";
import type { FrontClaim } from "../../core/types";

/** Every name a recipe line could print under, plus what the maker typed, lower case. */
function words(recipe: ComputedRecipe): string[] {
  return recipe.lines.map((l) => {
    const r = l.resolution;
    const names = r.status === "known" ? (r.parts ? r.parts.map((p) => p.labelName) : [r.labelName]) : [];
    return `${l.line.text} ${names.join(" ")}`.toLowerCase();
  });
}
function matches(recipe: ComputedRecipe, re: RegExp): string[] {
  return recipe.lines.filter((_, i) => re.test(words(recipe)[i]!)).map((l) => l.line.text);
}
const list = (xs: string[]) => xs.slice(0, 4).join(", ") + (xs.length > 4 ? "..." : "");

/** Animal-derived ingredients makers commonly use. */
const ANIMAL = /\b(beeswax|cera alba|honey|\bmel\b|lanolin|milk|lac\b|tallow|lard|carmine|ci 75470|silk|collagen|keratin|gelatin|emu oil|goat)\b/;
/** Essential oils, fragrance and other scent ingredients. */
const SCENT = /(essential oil|\boil of\b|fragrance|parfum|perfume|absolute|\beo\b|lavandula|mentha|citrus|eucalyptus|melaleuca|rosmarinus|pelargonium|cymbopogon|cedrus|santalum|vanilla|rosa damascena|rosa centifolia|matricaria|chamaemelum|citrus aurantium)/;

/**
 * Claims makers put on the front. These have no FDA definition, so the hints say what
 * backs each one up; the FTC expects any claim to be true and supportable.
 */
export const FRONT_CLAIMS: FrontClaim[] = [
  {
    key: "handmade",
    label: "Handmade",
    text: "Handmade",
  },
  {
    key: "small-batch",
    label: "Small batch",
    text: "Small batch",
  },
  {
    key: "vegan",
    label: "Vegan",
    text: "Vegan",
    hint: "No animal-derived ingredients: no beeswax, honey, lanolin, milk, tallow or carmine.",
    check(recipe) {
      const hits = matches(recipe, ANIMAL);
      return hits.length ? { level: "stop", text: `Not vegan: ${list(hits)} ${hits.length > 1 ? "come" : "comes"} from animals.` } : null;
    },
  },
  {
    key: "fragrance-free",
    label: "Fragrance-free",
    text: "Fragrance-free",
    hint: "No added scent at all, essential oils included.",
    check(recipe) {
      const hits = matches(recipe, SCENT);
      return hits.length
        ? { level: "stop", text: `Not fragrance-free: ${list(hits)} adds scent. Essential oils count as fragrance. "Unscented" has the same problem.` }
        : null;
    },
  },
  {
    key: "cruelty-free",
    label: "Cruelty-free",
    text: "Cruelty-free",
    hint: "No legal definition. Make sure you and your suppliers don't test on animals. The bunny logo needs Leaping Bunny certification.",
    check: () => ({
      level: "check",
      text: "\"Cruelty-free\" has no legal definition. Keep your suppliers' no-animal-testing statements on file, and don't use the Leaping Bunny logo unless you're certified.",
    }),
  },
  {
    key: "pet-safe",
    label: "Pet safe",
    text: "Pet safe",
    hint: "No standard behind it, and many essential oils are toxic to pets, especially cats.",
    check(recipe) {
      const hits = matches(recipe, SCENT);
      if (hits.length)
        return {
          level: "stop",
          text: `Not printed: ${list(hits)} can be harmful to pets, especially cats. Talk to a vet before claiming pet safe, and say what it's safe for.`,
        };
      return {
        level: "check",
        text: "\"Pet safe\" has no standard behind it. Be ready to back it up, and don't pair it with a \"keep away from pets\" warning.",
      };
    },
  },
];
