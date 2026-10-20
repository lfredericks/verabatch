"use server";

import { revalidatePath } from "next/cache";
import { readSizeForm } from "@/lib/sizes";
import { createClient } from "@/lib/supabase/server";

export interface SizeFormState {
  error?: string;
  saved?: number;
}

const UUID = /^[0-9a-f-]{36}$/i;

export async function saveSize(_prev: SizeFormState, form: FormData): Promise<SizeFormState> {
  const r = readSizeForm(form);
  if ("error" in r) return { error: r.error };
  if (!UUID.test(r.productId)) return { error: "Something went wrong. Reload the page and try again." };
  const supabase = await createClient();
  // business_id is filled in by the database from the product.
  const { error } = r.id
    ? await supabase.from("sizes").update(r.row).eq("id", r.id)
    : await supabase.from("sizes").insert({ ...r.row, product_id: r.productId });
  if (error) return { error: "We couldn't save that size. Try again in a moment." };
  revalidatePath(`/app/products/${r.productId}`);
  revalidatePath(`/app/products/${r.productId}/label`);
  return { saved: Date.now() };
}

export async function deleteSize(form: FormData) {
  const id = String(form.get("id") ?? "");
  const productId = String(form.get("product_id") ?? "");
  if (!UUID.test(id)) return;
  const supabase = await createClient();
  await supabase.from("sizes").delete().eq("id", id);
  revalidatePath(`/app/products/${productId}`);
  revalidatePath(`/app/products/${productId}/label`);
}
