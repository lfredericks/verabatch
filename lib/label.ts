import { checkClaims, computeRecipe, labelIngredients, netContentsFromBatch, type ComputedRecipe } from "./core";
import type { BusinessInfo, ClaimHit, MarketPack, ProductType, RecipeLine } from "./core/types";
import { sizeFacts, type Size, type SizeFacts } from "./sizes";

/**
 * The ingredient list as printed: the pack's label form of each name (US: common name
 * first), the maker's own names as typed, and which plant names still need an everyday name.
 */
export function printedIngredients(recipe: ComputedRecipe, pack: MarketPack): { names: string[]; needsCommon: string[] } {
  const custom = new Set(recipe.custom.map((l) => (l.resolution.status === "known" ? l.resolution.labelName : "")));
  const everyday = new Map<string, string>();
  for (const l of recipe.lines) {
    const r = l.resolution;
    if (r.status !== "known" || !l.line.common?.trim()) continue;
    for (const n of r.parts ? r.parts.map((p) => p.labelName) : [r.labelName]) everyday.set(n, l.line.common.trim());
  }
  const names: string[] = [];
  const needsCommon: string[] = [];
  for (const i of labelIngredients(recipe, pack)) {
    if (custom.has(i.name) || i.unresolved || !pack.printName) {
      names.push(i.name);
      continue;
    }
    const p = pack.printName(i.name, everyday.get(i.name));
    names.push(p.text);
    if (p.needsCommon) needsCommon.push(i.name);
  }
  return { names, needsCommon };
}

export interface LabelInput {
  product: { name: string; type_key: string; identity: string; makes: number | null; recipe: RecipeLine[] };
  business: BusinessInfo;
  size: Size | null;
  pack: MarketPack;
  /** The batch this label is for. Its recipe copy replaces the master recipe. */
  batch?: { lot: string; recipe: RecipeLine[] } | null;
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
  /** Ingredient names the maker typed themselves, not from the official list. */
  customNames: string[];
  approximate: boolean;
  productType?: ProductType;
}

/**
 * Everything printed on a label for one product and size, in plain text,
 * plus what to fix before printing. Market wording comes from the pack.
 */
export function buildLabel({ product, business, size, pack, batch }: LabelInput): Label {
  const productType = pack.productTypes.find((t) => t.key === product.type_key);
  const recipe = computeRecipe(batch ? batch.recipe : product.recipe, pack);
  const list = labelIngredients(recipe, pack);
  const printed = printedIngredients(recipe, pack);
  const ingredients = list.length ? `Ingredients: ${printed.names.join(", ")}.` : "";
  const facts = size ? sizeFacts(size, pack.lettering) : null;

  let net = facts?.net ?? null;
  if (!size && product.makes && recipe.totalGrams > 0) {
    net = netContentsFromBatch(recipe.totalGrams, recipe.totalMl, product.makes, productType?.declareBy ?? "weight");
  }

  const front = [product.name, product.identity, net].filter((x): x is string => Boolean(x && x.trim()));
  const back = [
    ingredients,
    ...(pack.backPanel?.({ business, ...(productType ? { productType } : {}) }) ?? []),
    batch ? `Lot ${batch.lot}` : "",
  ].filter(Boolean);

  const blockers: string[] = [];
  if (!list.length) blockers.push("Add the recipe so the ingredient list can be written.");
  if (recipe.needsChoice.length) blockers.push(`Answer the "which one?" question for: ${recipe.needsChoice.map((l) => l.line.text).join(", ")}.`);
  if (recipe.unknown.length) blockers.push(`Check these names, they're shown as typed: ${recipe.unknown.map((l) => l.line.text).join(", ")}.`);
  if (!product.identity.trim()) blockers.push("Add \"what it is\" (for example, Botanical Skin Balm). It goes under the name.");
  if (product.identity.trim() && product.identity.trim().toLowerCase() === product.name.trim().toLowerCase())
    blockers.push("\"What it is\" repeats the name. Describe the product instead, like Botanical Skin Balm.");
  if (!net) blockers.push(size ? "Check this size's fill amount." : "Add a size, or how many one batch makes, for the net weight.");
  if (!business.name.trim()) blockers.push("Add your business name in your business details.");
  if (printed.needsCommon.length)
    blockers.push(`US labels need the everyday name of each plant. Add one for: ${printed.needsCommon.join(", ")}.`);

  return {
    front,
    back,
    ingredients,
    net,
    size: facts,
    blockers,
    claims: checkClaims(`${product.name} ${product.identity}`, pack.claimRules),
    customNames: recipe.custom.map((l) => (l.resolution.status === "known" ? l.resolution.labelName : l.line.text)),
    approximate: !size && recipe.anyApproximate,
    ...(productType ? { productType } : {}),
  };
}
