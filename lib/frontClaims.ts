import type { ComputedRecipe } from "./core";
import type { MarketPack } from "./core/types";

/**
 * Front-of-label claims ("Vegan", "Handmade", "Made with organic shea butter") and the
 * organic math behind the organic ones. The claim list and its checks live in the market
 * pack (`frontClaims`); the organic tiers here follow the USDA National Organic Program
 * (7 CFR 205.301 and 205.304), which is what governs "organic" on US cosmetics made from
 * agricultural ingredients.
 */

/** Where the maker stands on organic certification. */
export type OrganicStatus = "certified" | "exempt" | "no";

export interface ProductClaims {
  /** Picked claims, by key from the pack's list. */
  keys: string[];
  organic: {
    status: OrganicStatus;
    /** Certifying agent, printed as "Certified organic by ...". Certified makers only. */
    certifier: string;
    /** Put the organic claim on the front (when the recipe qualifies). */
    front: boolean;
    /** For "Made with organic ...": up to three organic recipe lines, by line key. */
    madeWith: string[];
  };
  /** Optional "Contains: ..." allergen line on the back. */
  allergens: {
    on: boolean;
    /** Allergen groups the maker chose not to list. */
    skip: string[];
  };
}

export const NO_CLAIMS: ProductClaims = {
  keys: [],
  organic: { status: "no", certifier: "", front: false, madeWith: [] },
  allergens: { on: false, skip: [] },
};

/** Server-side check of claims from the browser or the database. */
export function cleanClaims(raw: unknown, pack: MarketPack): ProductClaims {
  const known = new Set((pack.frontClaims ?? []).map((c) => c.key));
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const keys = Array.isArray(o.keys) ? [...new Set(o.keys.filter((k): k is string => typeof k === "string" && known.has(k)))] : [];
  const org = o.organic && typeof o.organic === "object" ? (o.organic as Record<string, unknown>) : {};
  const status: OrganicStatus = org.status === "certified" || org.status === "exempt" ? org.status : "no";
  const certifier = typeof org.certifier === "string" ? org.certifier.replace(/\s+/g, " ").trim().slice(0, 100) : "";
  const madeWith = Array.isArray(org.madeWith)
    ? [...new Set(org.madeWith.filter((k): k is string => typeof k === "string" && /^[a-z0-9]{1,12}$/.test(k)))].slice(0, 3)
    : [];
  const al = o.allergens && typeof o.allergens === "object" ? (o.allergens as Record<string, unknown>) : {};
  const groups = new Set((pack.allergens?.groups ?? []).map((g) => g.key));
  const skip = Array.isArray(al.skip) ? [...new Set(al.skip.filter((k): k is string => typeof k === "string" && groups.has(k)))] : [];
  return { keys, organic: { status, certifier, front: org.front === true, madeWith }, allergens: { on: al.on === true, skip } };
}

/** Water and salt don't count toward the organic share (7 CFR 205.302). */
const NOT_COUNTED = /\b(water|aqua|sodium chloride|maris sal|sea salt|salt)\b/i;

export type OrganicTier = "organic" | "madeWith" | "listOnly" | "none";

export interface OrganicFacts {
  /** Organic share by weight, water and salt left out, 0–100. */
  pct: number;
  tier: OrganicTier;
  /** Recipe lines marked organic: their key and the name printed for them. */
  lines: { key: string; text: string; name: string }[];
  /** Label names that print as "Organic ..." in the ingredient list (every line of that name is organic). */
  organicNames: Set<string>;
  approximate: boolean;
}

function namesOf(l: ComputedRecipe["lines"][number]): string[] {
  const r = l.resolution;
  if (r.status !== "known") return [];
  return r.parts ? r.parts.map((p) => p.labelName) : [r.labelName];
}

/** The organic share of a recipe and the most it can claim. */
export function organicFacts(recipe: ComputedRecipe): OrganicFacts {
  let counted = 0;
  let organic = 0;
  const byName = new Map<string, { all: boolean }>();
  const lines: OrganicFacts["lines"] = [];
  for (const l of recipe.lines) {
    const names = namesOf(l);
    const label = names.join(" ") || l.line.text;
    const isOrganic = Boolean(l.line.organic);
    if (!NOT_COUNTED.test(label)) {
      counted += l.grams;
      if (isOrganic) organic += l.grams;
    }
    for (const n of names) byName.set(n, { all: (byName.get(n)?.all ?? true) && isOrganic });
    if (isOrganic && l.line.key) lines.push({ key: l.line.key, text: l.line.text, name: names[0] ?? l.line.text });
  }
  const pct = counted > 0 ? (organic / counted) * 100 : 0;
  // Round down, so 94.97% never reads as "95%".
  const shown = Math.floor(pct * 10) / 10;
  const tier: OrganicTier = shown >= 95 ? "organic" : shown >= 70 ? "madeWith" : organic > 0 ? "listOnly" : "none";
  return {
    pct: shown,
    tier,
    lines,
    organicNames: new Set([...byName].filter(([, v]) => v.all).map(([n]) => n)),
    approximate: recipe.anyApproximate,
  };
}

/** How the maker calls an ingredient, for "Made with organic ...": what they typed, minus "organic". */
export function everydayName(_labelName: string, typed: string): string {
  return typed.replace(/\b(certified\s+)?organic\b/gi, " ").replace(/\s+/g, " ").trim().toLowerCase() || typed.toLowerCase();
}

/** "a", "a and b", "a, b and c". */
function joinAnd(xs: string[]): string {
  return xs.length < 2 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
}

export interface AllergenFind {
  key: string;
  label: string;
  /** The recipe lines it's in, as the maker typed them (minus "organic"). */
  lines: string[];
}

/** Common allergens in a recipe, by group, in the pack's order. */
export function allergensIn(recipe: ComputedRecipe, pack: MarketPack): { found: AllergenFind[]; essentialOils: string[] } {
  const a = pack.allergens;
  if (!a) return { found: [], essentialOils: [] };
  const words = recipe.lines.map((l) => a.words(l));
  const found = a.groups
    .map((g) => ({
      key: g.key,
      label: g.label,
      lines: [...new Set(recipe.lines.filter((_, i) => g.re.test(words[i]!)).map((l) => everydayName("", l.line.text)))],
    }))
    .filter((f) => f.lines.length);
  const essentialOils = recipe.lines.filter((_, i) => a.essentialOil.test(words[i]!)).map((l) => l.line.text);
  return { found, essentialOils };
}

/** "Contains: sweet almond oil (tree nut), beeswax (bee product)." */
export function containsLine(found: AllergenFind[], skip: string[]): string {
  const parts = found.filter((f) => !skip.includes(f.key)).flatMap((f) => f.lines.map((l) => `${l} (${f.label})`));
  return parts.length ? `Contains: ${[...new Set(parts)].join(", ")}.` : "";
}

export interface ClaimResult {
  /** Lines for the front of the label, in order. */
  front: string[];
  /** Extra back-panel line ("Certified organic by ..."). */
  back: string[];
  /** Why a picked claim can't print, or what to double-check. */
  notes: { key: string; level: "stop" | "check"; text: string }[];
  organic: OrganicFacts;
  /** Allergens found in the recipe (whether or not the line prints). */
  allergens: { found: AllergenFind[]; essentialOils: string[]; line: string };
}

/**
 * What the claims put on the label for this recipe, and what's wrong with them.
 * Organic: the front claim prints only when the recipe's share qualifies AND the maker is
 * certified or exempt (organic sales of $5,000 a year or less, 7 CFR 205.101).
 */
export function claimsFor(claims: ProductClaims, recipe: ComputedRecipe, pack: MarketPack, ctx: { productName: string; identity: string }): ClaimResult {
  const organic = organicFacts(recipe);
  const notes: ClaimResult["notes"] = [];
  const front: string[] = [];
  const back: string[] = [];

  for (const c of pack.frontClaims ?? []) {
    if (!claims.keys.includes(c.key)) continue;
    const problem = c.check?.(recipe);
    if (problem) notes.push({ key: c.key, level: problem.level, text: problem.text });
    if (!problem || problem.level !== "stop") front.push(c.text);
  }

  const o = claims.organic;
  const canClaim = o.status === "certified" || o.status === "exempt";
  if (o.front) {
    if (!canClaim) {
      notes.push({
        key: "organic",
        level: "stop",
        text: "An organic claim on the front needs USDA organic certification, unless your organic sales are $5,000 a year or less. Organic ingredients can still be marked in the ingredient list.",
      });
    } else if (organic.tier === "organic") {
      front.push("Organic");
    } else if (organic.tier === "madeWith") {
      const picked = organic.lines.filter((l) => o.madeWith.includes(l.key)).slice(0, 3);
      if (picked.length) front.push(`Made with organic ${joinAnd(picked.map((l) => everydayName(l.name, l.text)))}`);
      else notes.push({ key: "organic", level: "stop", text: "Pick up to three organic ingredients to name in \"Made with organic ...\"." });
    } else {
      notes.push({
        key: "organic",
        level: "stop",
        text: `This recipe is ${organic.pct}% organic. The front can say "Made with organic ..." from 70%, and "Organic" from 95% (water and salt don't count). Below 70%, organic ingredients can only be marked in the ingredient list.`,
      });
    }
    if (canClaim && organic.tier !== "listOnly" && organic.tier !== "none" && organic.approximate)
      notes.push({
        key: "organic",
        level: "check",
        text: "Cups, spoons and drops are turned into weight with typical values, so the organic share is close, not exact. Weigh your ingredients to be sure.",
      });
  }
  if (o.status === "certified" && organic.lines.length) {
    if (o.certifier) back.push(`Certified organic by ${o.certifier}.`);
    else notes.push({ key: "organic", level: "stop", text: "Add the name of your organic certifier. It prints on the back as \"Certified organic by ...\"." });
  }
  if (o.status === "exempt" && o.front)
    notes.push({
      key: "organic",
      level: "check",
      text: "Exempt makers still follow the organic rules and keep records for 3 years, and can't use the USDA Organic seal or say \"certified\".",
    });

  // "Organic" in the product name follows the same rules as a front claim.
  if (/\borganic\b/i.test(`${ctx.productName} ${ctx.identity}`) && !(canClaim && (organic.tier === "organic" || organic.tier === "madeWith")))
    notes.push({
      key: "organic-name",
      level: "stop",
      text: "\"Organic\" is in the product name or the line under it. That counts as an organic claim, which needs 70% or more organic ingredients and certification (or the $5,000 exemption).",
    });

  const al = allergensIn(recipe, pack);
  const line = claims.allergens.on ? containsLine(al.found, claims.allergens.skip) : "";

  return { front, back, notes, organic, allergens: { ...al, line } };
}

