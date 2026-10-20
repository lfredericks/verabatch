"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { readBatchForm } from "@/lib/batches";
import { lotNumber, productInitials } from "@/lib/core";
import { cleanRecipe } from "@/lib/products";
import { createClient } from "@/lib/supabase/server";

export interface BatchFormState {
  error?: string;
}

const UUID = /^[0-9a-f-]{36}$/i;

async function loadContext(productId: string) {
  const supabase = await createClient();
  const [{ data: product }, { data: sizes }] = await Promise.all([
    supabase.from("products").select("id, name, recipe").eq("id", productId).maybeSingle(),
    supabase.from("sizes").select("id").eq("product_id", productId),
  ]);
  return { supabase, product, sizeIds: (sizes ?? []).map((s) => s.id as string) };
}

export async function saveBatch(_prev: BatchFormState, form: FormData): Promise<BatchFormState> {
  const productId = String(form.get("product_id") ?? "");
  if (!UUID.test(productId)) return { error: "Something went wrong. Reload the page and try again." };
  const { supabase, product, sizeIds } = await loadContext(productId);
  if (!product) return { error: "That product is gone. Go back and reload." };

  const b = readBatchForm(form, sizeIds);
  if (b.error) return { error: b.error };
  // The usual way = a frozen copy of the master recipe as it is right now.
  const master = cleanRecipe(product.recipe);
  const fields = { made_on: b.madeOn, changed: b.changed, counts: b.counts, recipe: b.changed ? b.recipe : master, note: b.note };

  if (b.id) {
    if (!UUID.test(b.id)) return { error: "Something went wrong. Reload the page and try again." };
    // Editing a usual batch keeps the recipe it was made with, even if the master changed since.
    const { data: existing } = await supabase.from("batches").select("changed, recipe").eq("id", b.id).maybeSingle();
    if (existing && !b.changed && !existing.changed) fields.recipe = cleanRecipe(existing.recipe);
    const { error } = await supabase.from("batches").update(fields).eq("id", b.id);
    if (error) return { error: "We couldn't save that batch. Try again in a moment." };
    revalidatePath(`/app/products/${productId}`);
    redirect(`/app/products/${productId}/label?batch=${b.id}`);
  }

  // New lot: initials + date + that day's count. Retry if two saves race for the same number.
  const prefix = `${productInitials(product.name)}-${b.madeOn.slice(2, 4)}${b.madeOn.slice(5, 7)}${b.madeOn.slice(8, 10)}`;
  let newId: string | null = null;
  for (let attempt = 0; attempt < 3 && !newId; attempt++) {
    const { data: lots } = await supabase.from("batches").select("lot").like("lot", `${prefix}-%`);
    const lot = lotNumber(product.name, b.madeOn, (lots ?? []).map((l) => l.lot as string));
    const { data, error } = await supabase
      .from("batches")
      .insert({ ...fields, product_id: productId, lot })
      .select("id")
      .single();
    if (data) newId = data.id as string;
    else if (error && error.code !== "23505") return { error: "We couldn't save that batch. Try again in a moment." };
  }
  if (!newId) return { error: "We couldn't save that batch. Try again in a moment." };
  revalidatePath(`/app/products/${productId}`);
  redirect(`/app/products/${productId}/label?batch=${newId}`);
}

export async function deleteBatch(form: FormData) {
  const id = String(form.get("id") ?? "");
  const productId = String(form.get("product_id") ?? "");
  if (!UUID.test(id) || !UUID.test(productId)) return;
  if (String(form.get("confirm") ?? "").trim() !== "DELETE") redirect(`/app/products/${productId}/manage`);
  const supabase = await createClient();
  await supabase.from("batches").delete().eq("id", id);
  revalidatePath(`/app/products/${productId}`);
  revalidatePath(`/app/products/${productId}/manage`);
  redirect(`/app/products/${productId}/manage`);
}
