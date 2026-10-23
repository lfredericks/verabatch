import type { WarningOption } from "../../core/types";

/**
 * Standard warning statements a maker can add to a label (US).
 *
 * "required" ones are FDA wording (21 CFR 740) and print exactly as written, each on its own.
 * The rest are common cautions; they print together after "Caution:".
 * FDA 740.2: warnings must be conspicuous (we print them in bold) and at least 1/16 in tall.
 *
 * Not offered on purpose: 740.10 ("safety ... has not been determined"), which a maker should
 * never need if they've checked their formula; 740.18 coal tar hair dye; 740.19 tanning products.
 */
export const WARNINGS: WarningOption[] = [
  // ---- FDA-required wording, when they apply ----
  {
    key: "bubble-bath",
    group: "Required by the FDA when it applies",
    text: "Caution: Use only as directed. Excessive use or prolonged exposure may cause irritation to skin and urinary tract. Discontinue use if rash, redness, or itching occurs. Consult your physician if irritation persists. Keep out of reach of children.",
    short: "Foaming bath product (FDA 740.17)",
    note: "Required if it foams in the bath (has a surfactant like SLSa, SCI or coco betaine), unless the label says it's for adults only.",
    required: true,
    suggestFor: ["bomb", "salts"],
  },
  {
    key: "pressurized",
    group: "Required by the FDA when it applies",
    text: "Warning: Avoid spraying in eyes. Contents under pressure. Do not puncture or incinerate. Do not store at temperature above 120°F. Keep out of reach of children.",
    short: "Pressurized can, aerosol (FDA 740.11)",
    note: "Only for aerosol cans. Pump sprays don't need it.",
    required: true,
  },

  // ---- Skin and body ----
  { key: "external", group: "Skin and body", text: "For external use only.", suggestFor: ["butter", "lotion", "salve", "oil", "face", "hair", "scrub", "salts", "bomb", "deodorant", "perfume", "mist"] },
  { key: "eyes", group: "Skin and body", text: "Avoid contact with eyes.", suggestFor: ["salve", "oil", "face", "hair", "scrub", "salts", "bomb", "soap", "shampoo", "conditioner", "perfume", "mist", "room"] },
  { key: "irritation", group: "Skin and body", text: "Discontinue use if irritation occurs.", suggestFor: ["butter", "lotion", "balm", "salve", "oil", "face", "hair", "scrub", "salts", "bomb", "soap", "shampoo", "conditioner", "deodorant", "perfume", "mist"] },
  { key: "broken-skin", group: "Skin and body", text: "Do not use on broken or irritated skin.", suggestFor: ["salve", "scrub", "deodorant"] },
  { key: "patch", group: "Skin and body", text: "Patch test before first use.", suggestFor: ["face", "perfume", "deodorant"] },
  { key: "children", group: "Skin and body", text: "Keep out of reach of children and pets.", ifCovered: { phrase: "keep out of reach of children", text: "Keep away from pets." }, suggestFor: ["salve", "oil", "perfume", "salts", "bomb", "room", "candle"] },
  { key: "pregnant", group: "Skin and body", text: "Consult a doctor before use if pregnant or nursing.", note: "Common on products with essential oils." },
  { key: "sun", group: "Skin and body", text: "May increase sensitivity to sunlight.", note: "For citrus oils like bergamot, lemon or lime on skin." },
  { key: "slippery", group: "Skin and body", text: "Tub and floor may be slippery after use.", suggestFor: ["oil", "scrub", "salts", "bomb"] },
  { key: "stain", group: "Skin and body", text: "May stain tubs, towels or fabrics.", note: "For colored bath bombs and oils." },

  // ---- Sprays ----
  { key: "no-skin", group: "Room and linen sprays", text: "Not for use on skin.", suggestFor: ["room"] },
  { key: "test-fabric", group: "Room and linen sprays", text: "Test on a hidden area of fabric first.", suggestFor: ["room"] },
  { key: "flammable", group: "Room and linen sprays", text: "Flammable. Keep away from heat, sparks and open flame.", note: "For alcohol-based sprays." },

  // ---- Candles (ASTM F2058 style) ----
  { key: "candle-sight", group: "Candles and wax melts", text: "Never leave a burning candle unattended. Burn within sight.", suggestFor: ["candle"] },
  { key: "candle-away", group: "Candles and wax melts", text: "Keep away from things that catch fire, children and pets.", suggestFor: ["candle"] },
  { key: "candle-wick", group: "Candles and wax melts", text: "Trim wick to 1/4 inch before each burn.", suggestFor: ["candle"] },
  { key: "candle-surface", group: "Candles and wax melts", text: "Burn on a heat-resistant surface, away from drafts.", suggestFor: ["candle"] },
  { key: "melt-warmer", group: "Candles and wax melts", text: "Use only in a warmer made for wax melts. Do not eat.", note: "For wax melts." },
];

export const WARNING_KEYS = new Set(WARNINGS.map((w) => w.key));
