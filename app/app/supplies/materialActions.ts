"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SUPPLY_UNITS, type SupplyUnit } from "@/lib/supplies";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

const UUID = /^[0-9a-f-]{36}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export interface AddState {
  error?: string;
}

const get = (form: FormData, k: string, max: number) => String(form.get(k) ?? "").trim().slice(0, max);
const okDate = (s: string) => (DATE.test(s) && !Number.isNaN(Date.parse(s)) ? s : null);
const okUnit = (u: string): SupplyUnit => (SUPPLY_UNITS.some((x) => x.key === u) ? (u as SupplyUnit) : "");
const money = (s: string): number | null => {
  const t = s.replace(/[$,\s]/g, "");
  return /^\d+(\.\d{1,2})?$/.test(t) ? Number(t) : null;
};

async function businessId(supabase: SupabaseClient): Promise<string | null> {
  const { data } = await supabase.from("business_members").select("business_id").limit(1).maybeSingle();
  return (data?.business_id as string) ?? null;
}

/** The material with this name, made if it's new ("Unrefined shea" is added once). */
async function materialFor(supabase: SupabaseClient, biz: string, name: string): Promise<{ id: string; name: string } | null> {
  const clean = name.trim().slice(0, 120);
  if (!clean) return null;
  const { data: found } = await supabase.from("materials").select("id, name").ilike("name", clean.replace(/[%_\\]/g, "\\$&")).limit(1).maybeSingle();
  if (found) return found as { id: string; name: string };
  const { data, error } = await supabase.from("materials").insert({ business_id: biz, name: clean }).select("id, name").single();
  if (error || !data) return null;
  return data as { id: string; name: string };
}

/** One delivery from the three-question flow (What did you get? How much? Where's it from?). */
export async function addDelivery(_prev: AddState, form: FormData): Promise<AddState> {
  const supabase = await createClient();
  const biz = await businessId(supabase);
  if (!biz) return { error: "Add your shop details first." };
  const materialId = get(form, "material_id", 40);
  let material: { id: string; name: string } | null = null;
  if (materialId) {
    if (!UUID.test(materialId)) return { error: "Something went wrong. Reload the page and try again." };
    const { data } = await supabase.from("materials").select("id, name").eq("id", materialId).maybeSingle();
    material = (data as { id: string; name: string } | null) ?? null;
  } else material = await materialFor(supabase, biz, get(form, "name", 120));
  if (!material) return { error: "Say what you got, like Unrefined shea." };
  const amount = get(form, "amount", 20);
  const { error } = await supabase.from("supplies").insert({
    business_id: biz,
    material_id: material.id,
    ingredient: material.name,
    amount,
    unit: amount ? okUnit(get(form, "unit", 10)) : "",
    supplier: get(form, "supplier", 120),
    supplier_lot: get(form, "supplier_lot", 60),
    received_on: okDate(get(form, "received_on", 10)) ?? new Date().toISOString().slice(0, 10),
    best_by: okDate(get(form, "best_by", 10)),
    organic: form.get("organic") === "1",
  });
  if (error) return { error: "We couldn't save that. Try again in a moment." };
  revalidatePath("/app/supplies");
  redirect(`/app/supplies/m/${material.id}?added=1`);
}

/** A whole invoice typed in by hand: shop, date, number, then each line becomes a delivery. */
export async function addInvoice(_prev: AddState, form: FormData): Promise<AddState> {
  const supabase = await createClient();
  const biz = await businessId(supabase);
  if (!biz) return { error: "Add your shop details first." };
  let lines: { name?: unknown; amount?: unknown; unit?: unknown; price?: unknown; lot?: unknown; organic?: unknown }[] = [];
  try {
    lines = JSON.parse(String(form.get("lines") ?? "[]"));
  } catch {
    lines = [];
  }
  const s = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const kept = (Array.isArray(lines) ? lines : []).slice(0, 60).filter((l) => s(l.name, 120));
  if (!kept.length) return { error: "Add at least one line: what you got." };
  const supplier = get(form, "supplier", 120);
  const date = okDate(get(form, "invoice_date", 10)) ?? new Date().toISOString().slice(0, 10);
  const prices = kept.map((l) => money(s(l.price, 20)));
  const { data: inv, error: invErr } = await supabase
    .from("invoices")
    .insert({
      business_id: biz,
      supplier,
      invoice_number: get(form, "invoice_number", 60),
      invoice_date: date,
      total: prices.some((p) => p !== null) ? prices.reduce<number>((t, p) => t + (p ?? 0), 0) : null,
    })
    .select("id")
    .single();
  if (invErr || !inv) return { error: "We couldn't save that invoice. Try again in a moment." };
  for (const [i, l] of kept.entries()) {
    const m = await materialFor(supabase, biz, s(l.name, 120));
    if (!m) continue;
    const amount = s(l.amount, 20);
    await supabase.from("supplies").insert({
      business_id: biz,
      material_id: m.id,
      ingredient: m.name,
      amount,
      unit: amount ? okUnit(s(l.unit, 10)) : "",
      supplier,
      supplier_lot: s(l.lot, 60),
      received_on: date,
      cost: prices[i],
      organic: l.organic === true,
      invoice_id: inv.id,
    });
  }
  revalidatePath("/app/supplies");
  redirect(`/app/supplies?invoice=${kept.length}`);
}

/** Rename a material, or set its blend list and note ("More details"). */
export async function saveMaterial(_prev: AddState, form: FormData): Promise<AddState> {
  const id = get(form, "id", 40);
  if (!UUID.test(id)) return { error: "Something went wrong. Reload the page and try again." };
  const name = get(form, "name", 120);
  if (!name) return { error: "Give it a name, like Unrefined shea." };
  const supabase = await createClient();
  const { error } = await supabase.from("materials").update({ name, blend: get(form, "blend", 2000), note: get(form, "note", 2000) }).eq("id", id);
  if (error) return { error: error.code === "23505" ? `You already have a supply called ${name}.` : "That didn't save. Try again in a moment." };
  await supabase.from("supplies").update({ ingredient: name }).eq("material_id", id);
  revalidatePath(`/app/supplies/m/${id}`);
  revalidatePath("/app/supplies");
  return {};
}
