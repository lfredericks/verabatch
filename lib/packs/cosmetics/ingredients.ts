import type { Ingredient } from "../../core/types";

/**
 * Curated maker-layer ingredients for the cosmetics pack.
 *
 * DRAFT: label names and densities are typical published values entered by hand.
 * Every entry must be checked against CosIng (and later wINCI) before launch;
 * set `source` and `checkedOn` when it is.
 *
 * Botanicals that come in several species or forms (lavender, chamomile...)
 * are NOT listed here: they live in varieties.ts so the app asks which one.
 */
type Row = [key: string, name: string, aliases: string[], labelName: string, density: number, note?: string];

const ROWS: Row[] = [
  // Butters
  ["shea", "Shea butter", ["shea", "unrefined shea", "refined shea"], "Butyrospermum Parkii (Shea) Butter", 0.91],
  ["cocoa", "Cocoa butter", ["cocoa", "cacao butter", "cocoa butter"], "Theobroma Cacao (Cocoa) Seed Butter", 0.91],
  ["mango", "Mango butter", ["mango"], "Mangifera Indica (Mango) Seed Butter", 0.91],
  // Oils
  ["coconut", "Coconut oil", ["coconut"], "Cocos Nucifera (Coconut) Oil", 0.92],
  ["fco", "Fractionated coconut oil", ["fractionated coconut", "fco", "mct oil"], "Caprylic/Capric Triglyceride", 0.94],
  ["almond", "Sweet almond oil", ["almond", "sweet almond"], "Prunus Amygdalus Dulcis (Sweet Almond) Oil", 0.91],
  ["jojoba", "Jojoba oil", ["jojoba"], "Simmondsia Chinensis (Jojoba) Seed Oil", 0.86],
  ["olive", "Olive oil", ["olive", "evoo"], "Olea Europaea (Olive) Fruit Oil", 0.91],
  ["avocado", "Avocado oil", ["avocado"], "Persea Gratissima (Avocado) Oil", 0.91],
  ["grapeseed", "Grapeseed oil", ["grapeseed", "grape seed"], "Vitis Vinifera (Grape) Seed Oil", 0.92],
  ["castor", "Castor oil", ["castor"], "Ricinus Communis (Castor) Seed Oil", 0.96],
  ["sunflower", "Sunflower oil", ["sunflower"], "Helianthus Annuus (Sunflower) Seed Oil", 0.92],
  ["apricot", "Apricot kernel oil", ["apricot"], "Prunus Armeniaca (Apricot) Kernel Oil", 0.91],
  ["rosehip", "Rosehip oil", ["rosehip", "rose hip"], "Rosa Canina Fruit Oil", 0.92],
  ["argan", "Argan oil", ["argan"], "Argania Spinosa Kernel Oil", 0.91],
  ["hemp", "Hemp seed oil", ["hemp"], "Cannabis Sativa Seed Oil", 0.93],
  // Waxes
  ["beeswax", "Beeswax", ["beeswax", "bees wax", "beeswax pellets"], "Beeswax", 0.6,
    "Beeswax pellets pack loosely, so volume measures vary a lot. Weigh it if you can."],
  ["beeswax-white", "White beeswax", ["white beeswax", "bleached beeswax", "white beeswax pellets"], "Beeswax", 0.6,
    "Beeswax pellets pack loosely, so volume measures vary a lot. Weigh it if you can."],
  ["beeswax-natural", "Natural beeswax", ["natural beeswax", "yellow beeswax", "raw beeswax", "natural beeswax pellets"], "Beeswax", 0.6,
    "Beeswax pellets pack loosely, so volume measures vary a lot. Weigh it if you can."],
  ["candelilla", "Candelilla wax", ["candelilla"], "Euphorbia Cerifera (Candelilla) Wax", 0.6],
  ["carnauba", "Carnauba wax", ["carnauba"], "Copernicia Cerifera (Carnauba) Wax", 0.6],
  ["soywax", "Soy wax", ["soy wax"], "Hydrogenated Soybean Oil", 0.6],
  // Antioxidants
  ["vite", "Vitamin E oil", ["vitamin e", "vit e", "tocopherol"], "Tocopherol", 0.95],
  ["roe", "Rosemary antioxidant", ["roe", "rosemary extract", "rosemary oleoresin", "rosemary antioxidant"], "Rosmarinus Officinalis (Rosemary) Leaf Extract", 0.95],
  // Single-species essential oils (multi-species ones live in varieties.ts)
  ["teatree", "Tea tree essential oil", ["tea tree"], "Melaleuca Alternifolia (Tea Tree) Leaf Oil", 0.89],
  ["rosemary", "Rosemary essential oil", ["rosemary", "rosemary essential oil", "rosemary eo"], "Rosmarinus Officinalis (Rosemary) Leaf Oil", 0.91],
  ["lemongrass", "Lemongrass essential oil", ["lemongrass"], "Cymbopogon Flexuosus Oil", 0.89],
  ["patchouli", "Patchouli essential oil", ["patchouli"], "Pogostemon Cablin Oil", 0.96],
  ["vetiver", "Vetiver essential oil", ["vetiver"], "Vetiveria Zizanoides Root Oil", 1.0],
  ["fragrance", "Fragrance oil", ["fragrance", "fragrance oil", "fo", "perfume oil"], "Fragrance", 0.95,
    "Fragrance oils can be listed as \"Fragrance.\" FDA is still writing rules on fragrance allergen disclosure, so this may change."],
  // Waters and humectants
  ["water", "Distilled water", ["water", "distilled water", "aqua"], "Water", 1.0],
  ["aloe", "Aloe vera juice", ["aloe", "aloe vera", "aloe gel"], "Aloe Barbadensis Leaf Juice", 1.0],
  ["witchhazel", "Witch hazel", ["witch hazel"], "Hamamelis Virginiana (Witch Hazel) Water", 1.0],
  ["glycerin", "Vegetable glycerin", ["glycerin", "glycerine", "vegetable glycerin"], "Glycerin", 1.26],
  ["honey", "Honey", ["honey", "raw honey"], "Honey", 1.42],
  // Powders, clays, salts
  ["arrowroot", "Arrowroot powder", ["arrowroot"], "Maranta Arundinacea Root Powder", 0.55],
  ["kaolin", "Kaolin clay", ["kaolin", "white clay"], "Kaolin", 0.6],
  ["bentonite", "Bentonite clay", ["bentonite"], "Bentonite", 0.85],
  ["oat", "Colloidal oatmeal", ["oat", "oats", "oatmeal", "colloidal oat", "colloidal oatmeal"], "Avena Sativa (Oat) Kernel Flour", 0.4],
  ["sugar", "Sugar", ["sugar", "white sugar", "cane sugar", "granulated sugar"], "Sucrose", 0.85],
  ["epsom", "Epsom salt", ["epsom", "epsom salt"], "Magnesium Sulfate", 1.0],
  ["seasalt", "Sea salt", ["sea salt", "dead sea salt", "salt"], "Maris Sal (Sea Salt)", 1.2],
  ["bakingsoda", "Baking soda", ["baking soda", "sodium bicarbonate", "bicarb"], "Sodium Bicarbonate", 1.0],
  ["citric", "Citric acid", ["citric", "citric acid"], "Citric Acid", 0.9],
  ["mica", "Mica", ["mica", "mica powder"], "Mica", 0.6,
    "Check that your mica is approved for this kind of product (lips, eyes or rinse-off)."],
  ["charcoal", "Activated charcoal", ["charcoal", "activated charcoal"], "Charcoal Powder", 0.3],
];

export const INGREDIENTS: Ingredient[] = ROWS.map(([key, name, aliases, labelName, density, note]) => ({
  key,
  name,
  aliases,
  labelName,
  density,
  ...(note ? { note } : {}),
  source: "draft",
  checkedOn: null,
}));
