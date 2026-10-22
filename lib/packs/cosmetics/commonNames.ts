import { COMMON_TO_LATIN } from "./aliases";

/**
 * US labels must name ingredients by their common English name; the Latin name may follow
 * in brackets ("Sweet Almond (Prunus Amygdalus Dulcis) Oil"). FDA does not accept Latin
 * names on their own. Source: fda.gov, "Cosmetic Ingredient Names" (checked Oct 22, 2026).
 *
 * Official (INCI) names come Latin-first, sometimes with the common name in brackets:
 * "Simmondsia Chinensis (Jojoba) Seed Oil". printName() turns them into
 * "Jojoba (Simmondsia Chinensis) Seed Oil".
 */

const title = (s: string) => s.replace(/(^|[\s/-])([a-z])/g, (_m, a: string, b: string) => a + b.toUpperCase());

/** Latin name (2 or 3 words) -> common name. Checked first, before any bracketed name. DRAFT. */
const LATIN_TO_COMMON: Record<string, string> = {
  "Aloe Barbadensis": "Aloe",
  "Anthemis Nobilis": "Roman Chamomile",
  "Chamomilla Recutita": "German Chamomile",
  "Argania Spinosa": "Argan",
  "Arnica Montana": "Arnica",
  "Boswellia Carterii": "Frankincense",
  "Boswellia Sacra": "Frankincense",
  "Boswellia Serrata": "Frankincense",
  "Calendula Officinalis": "Calendula",
  "Cananga Odorata": "Ylang Ylang",
  "Cannabis Sativa": "Hemp",
  "Capsicum Frutescens": "Cayenne Pepper",
  "Cedrus Atlantica": "Atlas Cedarwood",
  "Cedrus Deodara": "Himalayan Cedarwood",
  "Juniperus Virginiana": "Virginian Cedarwood",
  "Cinnamomum Cassia": "Cassia",
  "Cinnamomum Zeylanicum": "Cinnamon",
  "Cymbopogon Flexuosus": "Lemongrass",
  "Eucalyptus Citriodora": "Lemon Eucalyptus",
  "Eucalyptus Globulus": "Eucalyptus",
  "Eucalyptus Radiata": "Eucalyptus",
  "Lavandula Hybrida": "Lavandin",
  "Lavandula Latifolia": "Spike Lavender",
  "Maranta Arundinacea": "Arrowroot",
  "Ormenis Multicaulis": "Moroccan Chamomile",
  "Pogostemon Cablin": "Patchouli",
  "Rosa Canina": "Rosehip",
  "Rosa Centifolia": "Rose",
  "Rosa Damascena": "Rose",
  "Salvia Sclarea": "Clary Sage",
  "Salvia Officinalis": "Sage",
  "Santalum Album": "Sandalwood",
  "Santalum Austrocaledonicum": "Sandalwood",
  "Santalum Spicatum": "Sandalwood",
  "Vetiveria Zizanoides": "Vetiver",
  "Prunus Amygdalus Dulcis": "Sweet Almond",
  "Citrus Aurantium Dulcis": "Orange",
  "Citrus Aurantium Amara": "Bitter Orange",
  "Citrus Aurantium Bergamia": "Bergamot",
};

/** Words that start non-plant names: these are already common names. */
const NOT_PLANT_START = /^(hydrogenated|hydrolyzed|caprylic|sodium|potassium|magnesium|calcium|zinc|titanium|iron|citric|lactic|stearic|cetyl|cetearyl|glyceryl|polysorbate|charcoal|coco|decyl|lauryl|benzyl|phenoxyethanol|tocopheryl|ascorbyl|propanediol|butylene|caprylyl|maris)\b/i;

// Everyday plant names makers type (aliases) fill in the rest: Artemisia Vulgaris -> Mugwort.
// Only plants: minerals and chemicals (baking soda, Epsom salt) keep their official names.
for (const [common, latins] of Object.entries(COMMON_TO_LATIN)) {
  for (const l of latins) {
    const key = title(l);
    if (key.split(" ").length < 2 || NOT_PLANT_START.test(key) || key.toLowerCase() === common.toLowerCase()) continue;
    if (!LATIN_TO_COMMON[key]) LATIN_TO_COMMON[key] = title(common);
  }
}
const PLANT_PART = /\b(Flower|Flowers|Leaf|Leaves|Seed|Root|Bark|Fruit|Herb|Wood|Peel|Kernel|Bud|Stem|Rhizome|Resin|Gum|Juice|Nut|Berry|Petal|Needle|Twig|Cone|Rind)\b/;

export interface Printed {
  /** What goes on the label. */
  text: string;
  /** A plant name with no known common name: the maker has to supply one. */
  needsCommon: boolean;
}

/** Latin part and the rest of an official name, using the brackets when there are any. */
function split(name: string): { latin: string; bracket?: string; rest: string } {
  const m = name.match(/^([^()]+?)\s*\(([^)]+)\)\s*(.*)$/);
  if (m) return { latin: m[1]!.trim(), bracket: m[2]!.trim(), rest: m[3]!.trim() };
  const w = name.split(" ");
  for (const n of [3, 2]) {
    const latin = w.slice(0, n).join(" ");
    if (LATIN_TO_COMMON[latin]) return { latin, rest: w.slice(n).join(" ") };
  }
  return { latin: w.slice(0, 2).join(" "), rest: w.slice(2).join(" ") };
}

/** The US label form of an official ingredient name. `common` is the maker's own everyday name. */
export function printName(name: string, common?: string): Printed {
  const n = name.trim();
  if (!n) return { text: n, needsCommon: false };
  const { latin, bracket, rest } = split(n);
  const known = LATIN_TO_COMMON[latin] ?? (bracket && !/^matricaria$/i.test(bracket) ? bracket : undefined);
  const everyday = common?.trim() || known;
  if (everyday) return { text: [everyday, `(${latin})`, rest].filter(Boolean).join(" "), needsCommon: false };
  const looksLikePlant = !NOT_PLANT_START.test(n) && n.split(" ").length >= 3 && (PLANT_PART.test(n) || /\b(Oil|Extract|Water|Butter|Wax)$/.test(n));
  return { text: n, needsCommon: looksLikePlant };
}
