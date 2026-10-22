import type { ClaimRule } from "../../core/types";
import { OTHER_BRANDS_PATTERN, WORD_BRANDS_PATTERN } from "./brands";

/**
 * Words that can turn a cosmetic into a drug (FDA), a pesticide (EPA), or are advertising
 * claims that need proof (FTC). A starting point, not legal advice.
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
  { pattern: /\b(inflammation|inflamed|swelling|bruis\w*|circulation|immune|immunity|nerve pain|joint pain|muscle pain)\b/i, severity: "drug",
    why: "Talking about inflammation, swelling or body systems is a drug claim.", fix: "Describe how it feels on the skin instead, like \"warming\" or \"cooling.\"" },
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
  // Advertising claims (FTC): anything a shopper could check needs proof you can show.
  { pattern: /(#\s?1\b|\bnumber one\b|\bno\.\s?1\b|\bbest[- ]sell(ing|er)\b|\btop[- ]rated\b|\baward[- ]winning\b|\bmost popular\b)/i, severity: "check",
    why: "A ranking (#1, best-selling, award-winning) is a fact claim. The FTC expects you to be able to prove it.", fix: "Only use it with proof, like the actual award or sales numbers." },
  { pattern: /\b(best|finest|greatest|unbeatable|unmatched|unrivaled|the only|world'?s (best|finest))\b/i, severity: "check",
    why: "Bragging like \"the best\" is usually treated as opinion, but paired with something measurable (\"best in the industry,\" \"the only balm that...\") it becomes a claim you'd have to prove.", fix: "Say what actually makes it special: the ingredients, how it's made, how it feels." },
  { pattern: OTHER_BRANDS_PATTERN, severity: "check",
    why: "That's another company's brand (or a \"dupe\" of one). Using it to sell your product can be trademark infringement.", fix: "Leave the other brand out and describe yours on its own." },
  { pattern: WORD_BRANDS_PATTERN, severity: "check",
    why: "That looks like another company's brand. Using it to sell your product can be trademark infringement.", fix: "Leave the other brand out and describe yours on its own." },
  { pattern: /\b(better than|outperforms?|move over|beats|compared to|unlike (other|those)|versus|vs\.?)(?=\s|$)/i, severity: "check",
    why: "Comparing to another product needs proof, and naming their brand can raise trademark problems.", fix: "Talk about your product on its own, without the competitor." },
  { pattern: /\b(guaranteed?|miracle|magic(al)? results|works for everyone|instant(ly)? results|permanent(ly)?|never fails?|100% (effective|safe))\b/i, severity: "check",
    why: "Promises and guarantees are claims the FTC expects you to back up.", fix: "Describe what people can expect, without promising results." },
  { pattern: /\b(chemical[- ]free|no chemicals|non-?toxic|all[- ]natural|100% natural|completely safe|safe for (everyone|babies|kids|children|pregnan\w*))\b/i, severity: "check",
    why: "These are misleading or need evidence: everything is a chemical, \"natural\" has no legal definition, and safety claims for babies or pregnancy need testing.", fix: "Name the ingredients instead, like \"made with plant oils and beeswax.\"" },
  { pattern: /\b(fda approved|fda registered)\b/i, severity: "drug",
    why: "Cosmetics aren't FDA approved, so this is misleading.", fix: "Remove it." },
];
