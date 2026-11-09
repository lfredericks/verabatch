import type { SupabaseClient } from "@supabase/supabase-js";

export interface LotHit {
  supply: { id: string; ingredient: string; supplier: string; supplier_lot: string; received_on: string | null };
  batches: { id: string; lot: string; made_on: string; product_id: string; product: string }[];
}

interface Row {
  supply_id: string;
  batches: { id: string; lot: string; made_on: string; product_id: string; products: { name: string } | null } | null;
}

/** A supplier's lot number (a recall notice) to every batch that used it. */
export async function lookupLot(supabase: SupabaseClient, lot: string): Promise<LotHit[]> {
  const q = lot.trim().slice(0, 60);
  if (!q) return [];
  const { data: sups } = await supabase
    .from("supplies")
    .select("id, ingredient, supplier, supplier_lot, received_on")
    .ilike("supplier_lot", `%${q.replace(/[%_\\]/g, "\\$&")}%`)
    .limit(50);
  const supplies = (sups ?? []) as LotHit["supply"][];
  if (!supplies.length) return [];
  const { data: links } = await supabase
    .from("batch_supplies")
    .select("supply_id, batches(id, lot, made_on, product_id, products(name))")
    .in(
      "supply_id",
      supplies.map((s) => s.id),
    );
  return supplies.map((s) => {
    const seen = new Set<string>();
    const batches = ((links ?? []) as unknown as Row[])
      .filter((l) => l.supply_id === s.id && l.batches && !seen.has(l.batches.id) && seen.add(l.batches.id))
      .map((l) => ({ id: l.batches!.id, lot: l.batches!.lot, made_on: l.batches!.made_on, product_id: l.batches!.product_id, product: l.batches!.products?.name ?? "" }))
      .sort((a, b) => b.made_on.localeCompare(a.made_on));
    return { supply: s, batches };
  });
}

/** Spreadsheet-safe CSV: quotes, and a leading ' on anything a spreadsheet would run as a formula. */
export function toCsv(rows: string[][]): string {
  const cell = (v: string) => {
    const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
    return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  return rows.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}
