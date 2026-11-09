"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f-]{36}$/i;
const KEY = /^[a-z0-9]{1,20}$/;

async function productBusiness(productId: string, lineKey: string) {
  if (!UUID.test(productId) || !KEY.test(lineKey)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("business_id").eq("id", productId).maybeSingle();
  return data ? { supabase, business: data.business_id as string } : null;
}

/**
 * Save which of your supplies a recipe line is: a supply id, null = don't link,
 * "" = undecided again. Saved right away; it never counts as a recipe change.
 */
export async function linkLine(productId: string, lineKey: string, materialId: string | null): Promise<{ ok: boolean }> {
  const ctx = await productBusiness(productId, lineKey);
  if (!ctx || (materialId && !UUID.test(materialId))) return { ok: false };
  const { supabase, business } = ctx;
  const { error } =
    materialId === ""
      ? await supabase.from("line_links").delete().eq("product_id", productId).eq("line_key", lineKey)
      : await supabase
          .from("line_links")
          .upsert({ product_id: productId, line_key: lineKey, business_id: business, material_id: materialId }, { onConflict: "product_id,line_key" });
  revalidatePath(`/app/products/${productId}`);
  return { ok: !error };
}

/** "+ Add a new one": make the supply (no delivery yet) and link the line to it. */
export async function newSupplyForLine(productId: string, lineKey: string, name: string): Promise<{ id: string; name: string } | null> {
  const ctx = await productBusiness(productId, lineKey);
  const clean = name.trim().slice(0, 120);
  if (!ctx || !clean) return null;
  const { supabase, business } = ctx;
  const { data: found } = await supabase.from("materials").select("id, name").ilike("name", clean.replace(/[%_\\]/g, "\\$&")).limit(1).maybeSingle();
  const material =
    (found as { id: string; name: string } | null) ??
    ((await supabase.from("materials").insert({ business_id: business, name: clean }).select("id, name").single()).data as { id: string; name: string } | null);
  if (!material) return null;
  const { ok } = await linkLine(productId, lineKey, material.id);
  revalidatePath("/app/supplies");
  return ok ? material : null;
}
