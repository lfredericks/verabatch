import type { MarketPack } from "../core/types";
import { cosmeticsPack } from "./cosmetics";

/** Every market pack. A new market is a new pack listed here. */
export const PACKS: MarketPack[] = [cosmeticsPack];

/**
 * The market the app runs in. One market per deployment for now; set
 * NEXT_PUBLIC_MARKET to switch. Later this can come from the business.
 */
export function activePack(id = process.env.NEXT_PUBLIC_MARKET): MarketPack {
  return PACKS.find((p) => p.id === id) ?? cosmeticsPack;
}
