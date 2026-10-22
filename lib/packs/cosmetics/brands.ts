/**
 * Other companies' brand names makers are likely to mention. Using them to sell your own
 * product can be trademark infringement or false advertising. DRAFT: a starting list,
 * not every trademark; later makers could add their own.
 */
export const OTHER_BRANDS = [
  "tiger balm", "vicks", "vaporub", "bengay", "icy hot", "biofreeze", "gold bond", "aspercreme",
  "burt'?s bees", "aquaphor", "vaseline", "carmex", "chapstick", "blistex", "neosporin", "bag balm",
  "eucerin", "cerave", "cetaphil", "aveeno", "lubriderm", "jergens", "nivea", "neutrogena", "olay",
  "old spice", "tom'?s of maine", "dr\\.? bronner'?s", "weleda",
  "bath (and|&) body works", "young living", "doterra", "plant therapy", "mountain rose",
  "the ordinary", "kiehl'?s", "aesop", "glossier", "sol de janeiro", "drunk elephant", "la roche[- ]posay",
  "yankee candle", "febreze", "lysol", "mrs\\.? meyer'?s", "air wick",
  "chanel", "dior", "le labo", "jo malone", "baccarat rouge",
];

export const OTHER_BRANDS_PATTERN = new RegExp(`\\b(${OTHER_BRANDS.join("|")})\\b|\\b(dupe|dupes|knock-?off|inspired by|our version of|alternative to)\\b`, "i");

/**
 * Brands that are also everyday words ("lush lather", "a gentle method"): only flagged when
 * capitalized mid-sentence, the way a brand name is written.
 */
export const WORD_BRANDS_PATTERN = /(?<![.!?]\s|^)\b(Native|Method|Dove|Badger|Glade|Lush)\b/;
