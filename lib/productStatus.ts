import type { SupabaseClient } from "@supabase/supabase-js";
import { activePack } from "./packs";
import { buildLabel } from "./label";
import { effectiveRecipe } from "./productData";
import type { Product } from "./products";
import type { Size } from "./sizes";
import { cleanWarnings } from "./warnings";
import { cleanClaims } from "./frontClaims";

export interface ProductStatus {
  text: string;
  tone: "ok" | "warn" | "muted";
}

/**
 * One line of status for a product on the Products tab: "Label ready", "2 things to fix",
 * "Recipe not finished", "Pick a container". Checked the same way the product page does,
 * against the product's first size.
 */
export async function productStatuses(
  supabase: SupabaseClient,
  products: Product[],
  business: { name: string; city_state_zip: string; contact: string },
): Promise<Record<string, ProductStatus>> {
  const pack = activePack();
  const ids = products.map((p) => p.id);
  const { data: sizeRows } = ids.length
    ? await supabase.from("sizes").select("*").in("product_id", ids).order("position").order("created_at")
    : { data: [] };
  const firstSize = new Map<string, Size>();
  for (const s of (sizeRows ?? []) as (Size & { product_id: string })[]) if (!firstSize.has(s.product_id)) firstSize.set(s.product_id, s);
  const out: Record<string, ProductStatus> = {};
  await Promise.all(
    products.map(async (p) => {
      const { lines } = await effectiveRecipe(supabase, p);
      if (!lines.length) {
        out[p.id] = { text: "Recipe not finished", tone: "muted" };
        return;
      }
      const size = firstSize.get(p.id) ?? null;
      if (!size) {
        out[p.id] = { text: "Pick a container", tone: "warn" };
        return;
      }
      const raw = p as Product & { warnings?: unknown; claims?: unknown };
      const label = buildLabel({
        product: { ...p, recipe: lines, warnings: cleanWarnings(raw.warnings, pack), claims: cleanClaims(raw.claims, pack) },
        business: { name: business.name, cityStateZip: business.city_state_zip, contact: business.contact },
        size,
        pack,
      });
      const n = label.blockers.length;
      out[p.id] = n ? { text: n === 1 ? "1 thing to fix" : `${n} things to fix`, tone: "warn" } : { text: "Label ready", tone: "ok" };
    }),
  );
  return out;
}
