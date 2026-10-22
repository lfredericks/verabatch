/** Where makers sell. Each product can have its own description for each. */
export const CHANNELS = [
  { key: "etsy", label: "Etsy" },
  { key: "website", label: "Website" },
  { key: "amazon", label: "Amazon" },
  { key: "other", label: "Other", hint: "Craft fair signs, social posts, wholesale sheets." },
] as const;

export type ChannelKey = (typeof CHANNELS)[number]["key"];

export const MAX_DESCRIPTION = 8000;

/** Tidy stored descriptions: known channels only, text only, length-capped. */
export function cleanDescriptions(input: unknown): Partial<Record<ChannelKey, string>> {
  const out: Partial<Record<ChannelKey, string>> = {};
  if (!input || typeof input !== "object") return out;
  for (const c of CHANNELS) {
    const v = (input as Record<string, unknown>)[c.key];
    if (typeof v === "string" && v.trim()) out[c.key] = v.slice(0, MAX_DESCRIPTION);
  }
  return out;
}
