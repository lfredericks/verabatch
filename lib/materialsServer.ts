import type { SupabaseClient } from "@supabase/supabase-js";
import { computeRecipe, type RecipeLine } from "./core";
import { activePack } from "./packs";
import { allocate, inSupplyUnit, onHand, remaining, type Delivery, type Material } from "./materials";

export interface DeliveryLeft extends Delivery {
  /** What's left in the delivery's unit; null when no amount was logged. */
  left: number | null;
}

export interface MaterialView extends Material {
  deliveries: DeliveryLeft[];
  onHand: ReturnType<typeof onHand>;
  shops: string[];
}

const oldestFirst = (a: Delivery, b: Delivery) => (a.received_on ?? "9999").localeCompare(b.received_on ?? "9999") || a.id.localeCompare(b.id);

/** How much each delivery has had used, from batch links. */
async function usedBySupply(supabase: SupabaseClient, ids?: string[]): Promise<Map<string, number[]>> {
  let q = supabase.from("batch_supplies").select("supply_id, amount_used");
  if (ids) q = q.in("supply_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  const { data } = await q;
  const used = new Map<string, number[]>();
  for (const r of (data ?? []) as { supply_id: string; amount_used: number | string | null }[]) {
    if (r.amount_used === null) continue;
    (used.get(r.supply_id) ?? used.set(r.supply_id, []).get(r.supply_id)!).push(Number(r.amount_used));
  }
  return used;
}

/** Every material with its deliveries (oldest first), what's left of each, and the total on hand. */
export async function loadMaterials(supabase: SupabaseClient): Promise<{ materials: MaterialView[]; deliveries: DeliveryLeft[] }> {
  const [{ data: mats }, { data: sups }, used] = await Promise.all([
    supabase.from("materials").select("id, name, blend, note").order("name"),
    supabase.from("supplies").select("*").limit(2000),
    usedBySupply(supabase),
  ]);
  const deliveries = ((sups ?? []) as Delivery[])
    .map((d) => ({ ...d, left: remaining(d, used.get(d.id) ?? []) }))
    .sort(oldestFirst);
  const materials = ((mats ?? []) as Material[]).map((m) => {
    const ds = deliveries.filter((d) => d.material_id === m.id);
    const open = ds.filter((d) => !d.used_up);
    return {
      ...m,
      deliveries: ds,
      onHand: open.length ? onHand(open.map((d) => ({ left: d.left, unit: d.unit }))) : { amount: 0, unit: ds[0]?.unit ?? "" },
      shops: [...new Set(open.map((d) => d.supplier).filter(Boolean))],
    } as MaterialView;
  });
  return { materials, deliveries };
}

/**
 * Work out how much of each picked delivery a batch used, oldest first, and save it on the
 * batch's links. Line amounts are scaled by how many were made against what the recipe makes.
 */
export async function recordUsage(
  supabase: SupabaseClient,
  batchId: string,
  recipe: RecipeLine[],
  scale: number,
): Promise<void> {
  const { data: links } = await supabase.from("batch_supplies").select("line_key, supply_id").eq("batch_id", batchId);
  if (!links?.length) return;
  const ids = [...new Set(links.map((l) => l.supply_id as string))];
  const [{ data: sups }, used] = await Promise.all([supabase.from("supplies").select("*").in("id", ids), usedBySupply(supabase, ids)]);
  const byId = new Map(((sups ?? []) as Delivery[]).map((d) => [d.id, d]));
  const computed = computeRecipe(recipe, activePack()).lines;
  for (const line of recipe) {
    const c = computed.find((x) => x.line === line);
    if (!c || !line.key) continue;
    const picked = links
      .filter((l) => l.line_key === line.key)
      .map((l) => byId.get(l.supply_id as string))
      .filter((d): d is Delivery => Boolean(d))
      .sort(oldestFirst);
    const amt = { grams: c.grams * scale, ml: c.ml * scale };
    const parts = picked.map((d) => {
      const need = inSupplyUnit(amt, d.unit);
      const left = remaining(d, used.get(d.id) ?? []);
      return { d, need, left };
    });
    const countable = parts.filter((p) => p.need !== null && p.need > 0);
    // Shares of the line each delivery covers, oldest first.
    const shares = allocate(
      1,
      countable.map((p) => ({ id: p.d.id, left: p.left === null ? null : p.left / p.need! })),
    );
    for (const s of shares) {
      const p = countable.find((x) => x.d.id === s.id)!;
      const amount = Math.round(s.amount * p.need! * 10000) / 10000;
      await supabase.from("batch_supplies").update({ amount_used: amount }).eq("batch_id", batchId).eq("line_key", line.key).eq("supply_id", s.id);
      (used.get(s.id) ?? used.set(s.id, []).get(s.id)!).push(amount);
    }
  }
}
