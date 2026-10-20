import { checkClaims, computeRecipe, labelIngredients, netContentsFromBatch } from "./core";
import type { BusinessInfo, ClaimHit, MarketPack, ProductType, RecipeLine } from "./core/types";
import { sizeFacts, type Size, type SizeFacts } from "./sizes";

export interface LabelInput {
  product: { name: string; type_key: string; identity: string; makes: number | null; recipe: RecipeLine[] };
  business: BusinessInfo;
  size: Size | null;
  pack: MarketPack;
}

export interface Label {
  front: string[];
  back: string[];
  ingredients: string;
  /** Net contents line, or null if it can't be worked out yet. */
  net: string | null;
  size: SizeFacts | null;
  /** Problems that should stop printing. */
  blockers: string[];
  /** Risky words in the name or "what it is" line. */
  claims: ClaimHit[];
  approximate: boolean;
  productType?: ProductType;
}

/**
 * Everything printed on a label for one product and size, in plain text,
 * plus what to fix before printing. Market wording comes from the pack.
 */
export function buildLabel({ product, business, size, pack }: LabelInput): Label {
  const productType = pack.productTypes.find((t) => t.key === product.type_key);
  const recipe = computeRecipe(product.recipe, pack);
  const list = labelIngredients(recipe, pack);
  const ingredients = list.length ? `Ingredients: ${list.map((i) => i.name).join(", ")}.` : "";
  const facts = size ? sizeFacts(size, pack.lettering) : null;

  let net = facts?.net ?? null;
  if (!size && product.makes && recipe.totalGrams > 0) {
    net = netContentsFromBatch(recipe.totalGrams, recipe.totalMl, product.makes, productType?.declareBy ?? "weight");
  }

  const front = [product.name, product.identity, net].filter((x): x is string => Boolean(x && x.trim()));
  const back = [ingredients, ...(pack.backPanel?.({ business, ...(productType ? { productType } : {}) }) ?? [])].filter(Boolean);

  const blockers: string[] = [];
  if (!list.length) blockers.push("Add the recipe so the ingredient list can be written.");
  if (recipe.needsChoice.length) blockers.push(`Answer the "which one?" question for: ${recipe.needsChoice.map((l) => l.line.text).join(", ")}.`);
  if (recipe.unknown.length) blockers.push(`Check these names, they're shown as typed: ${recipe.unknown.map((l) => l.line.text).join(", ")}.`);
  if (!product.identity.trim()) blockers.push("Add \"what it is\" (for example, Botanical Skin Balm). It goes under the name.");
  if (product.identity.trim() && product.identity.trim().toLowerCase() === product.name.trim().toLowerCase())
    blockers.push("\"What it is\" repeats the name. Describe the product instead, like Botanical Skin Balm.");
  if (!net) blockers.push(size ? "Check this size's fill amount." : "Add a size, or how many one batch makes, for the net weight.");
  if (!business.name.trim()) blockers.push("Add your business name in your business details.");

  return {
    front,
    back,
    ingredients,
    net,
    size: facts,
    blockers,
    claims: checkClaims(`${product.name} ${product.identity}`, pack.claimRules),
    approximate: !size && recipe.anyApproximate,
    ...(productType ? { productType } : {}),
  };
}
