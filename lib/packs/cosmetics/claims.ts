import type { ClaimRule } from "../../core/types";

/**
 * Words that can turn a cosmetic into a drug (FDA), a pesticide (EPA),
 * or otherwise need evidence. A starting point, not legal advice.
 */
export const CLAIM_RULES: ClaimRule[] = [
  { pattern: /\b(heal|heals|healing|cure|cures|curing|treat|treats|treating|treatment)\b/i, severity: "drug",
    why: "Sounds like it treats a condition, which makes it a drug to the FDA.", fix: "Try \"softens\" or \"comforts dry skin.\"" },
  { pattern: /\b(eczema|psoriasis|dermatitis|rosacea|acne|rash|rashes|wounds?|burns?|infections?)\b/i, severity: "drug",
    why: "Naming a skin condition makes it a drug to the FDA.", fix: "Leave the condition out." },
  { pattern: /\banti-?(inflammatory|bacterial|fungal|septic|microbial|viral)\b/i, severity: "drug",
    why: "\"Anti-\" plus a germ or inflammation is a drug claim.", fix: "Remove it." },
  { pattern: /\b(pain|relieves?|relief|aches?|sore muscles?|arthritis|headaches?)\b/i, severity: "drug",
    why: "Pain relief is a drug claim.", fix: "Talk about the scent or the ritual instead." },
  { pattern: /\b(spf|sunscreen|sun protection|uv protection|sunblock)\b/i, severity: "drug",
    why: "Sun protection claims make it an OTC drug.", fix: "Remove unless you test and register it as a drug." },
  { pattern: /\b(hair growth|regrow|regrowth|grows hair|hair loss)\b/i, severity: "drug",
    why: "Hair growth or loss claims are drug claims.", fix: "Try \"for healthy-looking hair.\"" },
  { pattern: /\b(insomnia|anxiety|depression|sleep aid|stress relief)\b/i, severity: "drug",
    why: "Mood or sleep claims can make aromatherapy a drug.", fix: "Describe the scent and ritual instead." },
  { pattern: /\b(antiperspirant|stops? sweat(ing)?|prevents? sweat(ing)?)\b/i, severity: "drug",
    why: "Stopping sweat is an antiperspirant claim, which is an OTC drug.", fix: "Talk about odor and freshness instead." },
  { pattern: /\b(repels?|repellent|insects?|mosquito(es)?|bugs?|ticks?|kills? germs|disinfect\w*|sanitiz\w*)\b/i, severity: "check",
    why: "Repelling bugs or killing germs is a pesticide claim, which the EPA regulates.", fix: "Remove it unless the product is registered or qualifies for an exemption." },
  { pattern: /\b(purif(y|ies|ying)|air purifying)\b/i, severity: "check",
    why: "\"Purifying\" can read as a germ-killing or health claim.", fix: "Describe what it does plainly, like \"absorbs odors.\"" },
  { pattern: /\b(detox|detoxify|detoxifying|toxins?)\b/i, severity: "check",
    why: "\"Detox\" has no legal definition and can read as a health claim.", fix: "Try \"deep-cleansing.\"" },
  { pattern: /\b(organic)\b/i, severity: "check",
    why: "Saying \"organic\" brings in USDA organic labeling rules.", fix: "Only claim it if your ingredients and process qualify." },
  { pattern: /\b(hypoallergenic|dermatologist|clinically)\b/i, severity: "check",
    why: "This needs evidence you can back up.", fix: "Remove unless you have testing." },
  { pattern: /\b(fda approved|fda registered)\b/i, severity: "drug",
    why: "Cosmetics aren't FDA approved, so this is misleading.", fix: "Remove it." },
];
