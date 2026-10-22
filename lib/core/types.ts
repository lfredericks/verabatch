/**
 * Core types shared by every market pack.
 *
 * The core knows how to turn a recipe into weights, percentages, an ingredient
 * order, net contents and lot numbers. Everything specific to a market
 * (cosmetics, baked goods, pet treats...) lives in a MarketPack.
 */

export type WeightUnit = "g" | "kg" | "oz" | "lb";
export type VolumeUnit = "ml" | "l" | "tsp" | "tbsp" | "cup" | "floz" | "drop";
export type Unit = WeightUnit | VolumeUnit;

/** How the maker declares net contents on the label. */
export type DeclareBy = "weight" | "volume";

/** One line of a recipe, stored exactly as the maker typed it. */
export interface RecipeLine {
  /** The amount as typed: "12", "1/2", "1 1/2", "0.25". Never rounded. */
  amount: string;
  unit: Unit;
  /** The ingredient as typed: "shea", "10 drops lavender", "chamomile". */
  text: string;
  /** Answers to variety questions ("which chamomile?"), when the pack asks them. */
  variety?: VarietyChoice;
  /** Stable id for the line, so variations can say which parent line they change. */
  key?: string;
  /**
   * A name the maker chose for this line: an official name from the market's list, or
   * their own name (printed as typed and flagged as not official).
   */
  pick?: NamePick;
  /** The maker's everyday name for a plant ingredient whose common name we don't know. */
  common?: string;
}

export interface NamePick {
  kind: "official" | "custom";
  name: string;
}

/** The business details that go on labels. */
export interface BusinessInfo {
  name: string;
  cityStateZip: string;
  contact: string;
  /** Country for the "made by" line. Packs choose a default (USA for the US cosmetics pack). */
  country?: string;
}

/** One answer to a "which one?" question. */
export interface Choice {
  key: string;
  label: string;
  note?: string;
}

export interface VarietyChoice {
  group: string;
  variety?: string;
  form?: string;
  carrier?: string;
}

/** A reference ingredient in a market pack's dictionary. */
export interface Ingredient {
  key: string;
  /** The everyday name shown to makers. */
  name: string;
  /** Other names makers type for it. */
  aliases: string[];
  /** The name that goes on the label (INCI for cosmetics). */
  labelName: string;
  /** Grams per millilitre, used to turn cups, spoons and drops into weight. */
  density: number;
  /** A short note shown to the maker when this ingredient is used. */
  note?: string;
  /** Where the label name came from, e.g. "CosIng" or "draft". */
  source: string;
  /** Date (YYYY-MM-DD) the entry was last checked by hand, or null if never. */
  checkedOn: string | null;
}

/** What a recipe line resolved to. */
export type Resolution =
  | {
      status: "known";
      labelName: string;
      density: number;
      displayName: string;
      ingredientKey?: string;
      /**
       * For one line that is really several label ingredients (an infused oil is the
       * carrier oil plus the plant extract). Shares are fractions of the line's weight.
       * A share of 0 means "a trace": listed among the under-1% ingredients.
       */
      parts?: { labelName: string; share: number }[];
      /** Set when the maker picked the name: "custom" names aren't official and get flagged. */
      pick?: NamePick["kind"];
    }
  | {
      status: "needsChoice";
      group: string;
      question: string;
      missing: "variety" | "form" | "carrier";
      /** What was already worked out from the wording or the unit. */
      known: { variety?: string; form?: string; carrier?: string };
      /** A tip about the chosen variety, shown with the question. */
      note?: string;
    }
  | { status: "unknown" };

export interface ClaimRule {
  pattern: RegExp;
  severity: "drug" | "check";
  why: string;
  fix: string;
}

export interface ClaimHit {
  word: string;
  severity: ClaimRule["severity"];
  why: string;
  fix: string;
}

export interface ProductType {
  key: string;
  label: string;
  /** Default "what it is" line under the product name. */
  identity: string;
  declareBy: DeclareBy;
  /** "body" products follow cosmetic rules; "home" products don't. */
  use: "body" | "home";
}

/** Minimum net-contents letter height by front-panel area. */
export interface LetteringStep {
  /** Applies when area (sq in) is at most this value. Infinity for the last step. */
  maxAreaSqIn: number;
  /** Minimum letter height, as text shown to makers. */
  minHeight: string;
  /** Same, in inches, for checks. */
  minHeightIn: number;
}

/**
 * Everything specific to one market. Adding a market means writing a new pack,
 * not changing the core.
 */
export interface MarketPack {
  id: string;
  name: string;
  productTypes: ProductType[];
  /** Ingredients under this percentage may be listed in any order at the end. */
  minorThresholdPct: number;
  lettering: LetteringStep[];
  claimRules: ClaimRule[];
  /** Resolve what a maker typed into a label name and density, or say what to ask. */
  resolve(line: RecipeLine): Resolution;
  /**
   * Lines for the back of the label besides the ingredient list: who made it,
   * where, and how to reach them. Wording is the pack's, so each market can differ.
   */
  backPanel?(ctx: { business: BusinessInfo; productType?: ProductType }): string[];
  /**
   * The label form of an official name (e.g. US: common name first, Latin in brackets).
   * needsCommon: the maker must supply an everyday name before printing.
   */
  printName?(labelName: string, common?: string): { text: string; needsCommon: boolean };
  /** Rough grams per mL for a name the maker picked (by its last word: oil, butter, water...). */
  guessDensity?(labelName: string): number;
  /** The options to show for a "which one?" question from resolve(). */
  choices?(question: Extract<Resolution, { status: "needsChoice" }>): Choice[];
}
