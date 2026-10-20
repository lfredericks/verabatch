import { hasWords, normalize } from "../../core/text";
import type { Choice, Ingredient, LetteringStep, MarketPack, ProductType, RecipeLine, Resolution } from "../../core/types";
import { CLAIM_RULES } from "./claims";
import { INGREDIENTS } from "./ingredients";
import { CARRIERS, FORM_DETECT_ORDER, FORMS, VARIETY_GROUPS, type FormKey, type VarietyGroup } from "./varieties";

export const PRODUCT_TYPES: ProductType[] = [
  { key: "butter", label: "Body butter", identity: "Whipped Body Butter", declareBy: "weight", use: "body" },
  { key: "lotion", label: "Lotion or cream", identity: "Body Lotion", declareBy: "volume", use: "body" },
  { key: "balm", label: "Lip balm", identity: "Lip Balm", declareBy: "weight", use: "body" },
  { key: "salve", label: "Salve or balm", identity: "Botanical Skin Balm", declareBy: "weight", use: "body" },
  { key: "oil", label: "Body oil", identity: "Body Oil", declareBy: "volume", use: "body" },
  { key: "face", label: "Face oil or serum", identity: "Facial Oil", declareBy: "volume", use: "body" },
  { key: "hair", label: "Hair or beard oil", identity: "Beard Oil", declareBy: "volume", use: "body" },
  { key: "scrub", label: "Sugar or salt scrub", identity: "Sugar Body Scrub", declareBy: "weight", use: "body" },
  { key: "salts", label: "Bath salts or soak", identity: "Bath Soak", declareBy: "weight", use: "body" },
  { key: "bomb", label: "Bath bomb", identity: "Bath Bomb", declareBy: "weight", use: "body" },
  { key: "soap", label: "Bar soap", identity: "Handmade Soap", declareBy: "weight", use: "body" },
  { key: "shampoo", label: "Shampoo bar", identity: "Shampoo Bar", declareBy: "weight", use: "body" },
  { key: "conditioner", label: "Conditioner bar", identity: "Conditioner Bar", declareBy: "weight", use: "body" },
  { key: "deodorant", label: "Deodorant", identity: "Natural Deodorant", declareBy: "weight", use: "body" },
  { key: "perfume", label: "Perfume oil", identity: "Perfume Oil", declareBy: "volume", use: "body" },
  { key: "mist", label: "Face or body mist", identity: "Botanical Body Mist", declareBy: "volume", use: "body" },
  { key: "room", label: "Room or linen spray", identity: "Room & Linen Spray", declareBy: "volume", use: "home" },
  { key: "candle", label: "Candle or wax melt", identity: "Soy Candle", declareBy: "weight", use: "home" },
];

/** Spec: up to 5 sq in, 1/16 in; over 5 to 25, 1/8 in; over 25 to 100, 3/16 in; over 100 to 400, 1/4 in. */
export const LETTERING: LetteringStep[] = [
  { maxAreaSqIn: 5, minHeight: "1/16 in", minHeightIn: 1 / 16 },
  { maxAreaSqIn: 25, minHeight: "1/8 in", minHeightIn: 1 / 8 },
  { maxAreaSqIn: 100, minHeight: "3/16 in", minHeightIn: 3 / 16 },
  { maxAreaSqIn: 400, minHeight: "1/4 in", minHeightIn: 1 / 4 },
  { maxAreaSqIn: Infinity, minHeight: "1/2 in", minHeightIn: 1 / 2 },
];

/** Text used for matching: lower case, punctuation gone. "Essential oil" is kept so form detection can see it. */
function matchText(line: RecipeLine): string {
  return normalize(line.text);
}

/** Ingredient lookup: the longest alias found as whole words wins ("white beeswax" beats "beeswax"). */
export function findIngredient(text: string): Ingredient | null {
  const n = normalize(text).replace(/\b(essential oil|eo)\b/g, " ").replace(/\s+/g, " ").trim();
  if (!n) return null;
  let best: Ingredient | null = null;
  let bestLen = 0;
  for (const ing of INGREDIENTS) {
    for (const alias of [ing.name, ...ing.aliases]) {
      const a = normalize(alias);
      if (n === a) return ing;
      if (a.length > bestLen && hasWords(n, a)) {
        best = ing;
        bestLen = a.length;
      }
    }
  }
  return best;
}

export function findVarietyGroup(text: string): VarietyGroup | null {
  const n = normalize(text);
  for (const g of VARIETY_GROUPS) {
    if (g.exclude?.some((x) => hasWords(n, normalize(x)))) continue;
    if (g.triggers.some((t) => hasWords(n, t))) return g;
  }
  return null;
}

function formsFor(group: VarietyGroup, varietyKey: string | undefined): FormKey[] {
  const v = group.varieties.find((x) => x.key === varietyKey);
  return v?.only ?? group.forms;
}

/** Work out what we can from the wording and the unit, before asking anything. */
function detect(line: RecipeLine, group: VarietyGroup): { variety?: string; form?: FormKey; carrier?: string } {
  const n = matchText(line);
  const variety =
    group.varieties.length === 1
      ? group.varieties[0]!.key
      : group.varieties.find((v) => v.keywords.some((k) => hasWords(n, k)))?.key;
  const forms = formsFor(group, variety);
  let form: FormKey | undefined;
  if (forms.length === 1) form = forms[0];
  else {
    form = FORM_DETECT_ORDER.find((f) => forms.includes(f) && FORMS[f].keywords.some((k) => hasWords(n, k)));
    // Drops only make sense for essential oils.
    if (!form && line.unit === "drop" && forms.includes("eo")) form = "eo";
  }
  const carrier = CARRIERS.find((c) => c.keywords.some((k) => hasWords(n, k)))?.key;
  return {
    ...(variety ? { variety } : {}),
    ...(form ? { form } : {}),
    ...(carrier ? { carrier } : {}),
  };
}

function resolveVariety(line: RecipeLine, group: VarietyGroup): Resolution {
  const det = detect(line, group);
  const chosen = line.variety?.group === group.key ? line.variety : undefined;
  const variety = chosen?.variety ?? det.variety;
  let form = (chosen?.form as FormKey | undefined) ?? det.form;
  const carrier = chosen?.carrier ?? det.carrier;
  const allowed = formsFor(group, variety);
  if (form && !allowed.includes(form)) form = allowed.length === 1 ? allowed[0] : undefined;
  const known = { ...(variety ? { variety } : {}), ...(form ? { form } : {}), ...(carrier ? { carrier } : {}) };

  if (!variety) return { status: "needsChoice", group: group.key, question: group.question, missing: "variety", known };
  const V = group.varieties.find((v) => v.key === variety)!;
  if (!form) {
    const question = group.varieties.length > 1 ? `${V.label} as...` : group.question;
    return { status: "needsChoice", group: group.key, question, missing: "form", known, ...(V.note ? { note: V.note } : {}) };
  }
  if (form === "infused" && !carrier) {
    return { status: "needsChoice", group: group.key, question: "Infused in which oil?", missing: "carrier", known, ...(V.note ? { note: V.note } : {}) };
  }

  let labelName: string;
  let displayName: string;
  if (form === "infused") {
    const C = CARRIERS.find((c) => c.key === carrier)!;
    labelName = `${C.labelName}, ${V.base} Extract`;
    displayName = `${V.label} infused oil (${C.label.replace(/ oil$/i, "").toLowerCase()})`;
  } else {
    labelName =
      form === "eo" ? V.eo ?? `${V.base} Oil`
      : form === "hydrosol" ? `${V.base} Water`
      : form === "extract" ? `${V.base} Extract`
      : V.base;
    displayName = form === "flower" ? `${V.label} (dried)` : `${V.label} ${FORMS[form].suffix}`;
  }
  return { status: "known", labelName, density: FORMS[form].density, displayName };
}

export function resolveLine(line: RecipeLine): Resolution {
  // An exact ingredient name (e.g. "Rosemary antioxidant") wins over a variety question.
  const direct = findIngredient(line.text);
  const group = findVarietyGroup(line.text);
  if (group && !(direct && normalize(direct.name) === normalize(line.text))) return resolveVariety(line, group);
  if (direct) return { status: "known", labelName: direct.labelName, density: direct.density, displayName: direct.name, ingredientKey: direct.key };
  return { status: "unknown" };
}

/** Options for a "which one?" question. */
export function choicesFor(q: Extract<Resolution, { status: "needsChoice" }>): Choice[] {
  const group = VARIETY_GROUPS.find((g) => g.key === q.group);
  if (!group) return [];
  if (q.missing === "variety") {
    return group.varieties.map((v) => ({ key: v.key, label: `${v.label} (${v.latin})`, ...(v.note ? { note: v.note } : {}) }));
  }
  if (q.missing === "form") {
    return formsFor(group, q.known.variety).map((f) => ({ key: f, label: FORMS[f].label }));
  }
  return CARRIERS.map((c) => ({ key: c.key, label: c.label }));
}

export const cosmeticsPack: MarketPack = {
  id: "cosmetics",
  name: "Cosmetics and home fragrance",
  productTypes: PRODUCT_TYPES,
  minorThresholdPct: 1,
  lettering: LETTERING,
  claimRules: CLAIM_RULES,
  resolve: resolveLine,
  choices: choicesFor,
};
