import type { SupabaseClient } from "@supabase/supabase-js";
import { amountShort } from "./materials";
import type { MaterialView } from "./materialsServer";

/** Line key → the supply (material id) it is, or null for "don't link". Missing = not decided. */
export type LineLinks = Record<string, string | null>;

/** One of your supplies, as a recipe line offers it: name plus shops and what's left. */
export interface SupplyChoice {
  id: string;
  name: string;
  detail: string;
}

/** A product's line links; a variation starts from its parent's and its own win. */
export async function loadLineLinks(supabase: SupabaseClient, product: { id: string; parent_id?: string | null }): Promise<LineLinks> {
  const ids = [product.parent_id, product.id].filter((x): x is string => Boolean(x));
  const { data, error } = await supabase.from("line_links").select("product_id, line_key, material_id").in("product_id", ids);
  // Before migration 0018 runs the table isn't there: behave as if nothing is linked.
  if (error || !data) return {};
  const out: LineLinks = {};
  for (const id of ids)
    for (const r of data as { product_id: string; line_key: string; material_id: string | null }[])
      if (r.product_id === id) out[r.line_key] = r.material_id;
  return out;
}

export function supplyChoices(materials: MaterialView[]): SupplyChoice[] {
  return materials.map((m) => ({
    id: m.id,
    name: m.name,
    detail: [m.shops.join(", "), m.onHand?.unit ? `${amountShort(m.onHand.amount, m.onHand.unit)} left` : ""].filter(Boolean).join(" · "),
  }));
}
