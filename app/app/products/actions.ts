"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { activePack } from "@/lib/packs";
import { cleanRecipe } from "@/lib/products";
import { createClient } from "@/lib/supabase/server";

export interface ProductFormState {
  error?: string;
  saved?: boolean;
}

function readForm(form: FormData) {
  const pack = activePack();
  const typeKey = String(form.get("type_key") ?? "").trim();
  const makesRaw = String(form.get("makes") ?? "").trim();
  const makes = makesRaw ? Math.round(Number(makesRaw)) : null;
  let recipe: unknown = [];
  try {
    recipe = JSON.parse(String(form.get("recipe") ?? "[]"));
  } catch {
    recipe = [];
  }
  return {
    id: String(form.get("id") ?? ""),
    name: String(form.get("name") ?? "").trim(),
    type_key: pack.productTypes.some((t) => t.key === typeKey) || typeKey === "other" ? typeKey : "",
    identity: String(form.get("identity") ?? "").trim(),
    makes,
    recipe: cleanRecipe(recipe),
  };
}

function check(p: ReturnType<typeof readForm>): string | undefined {
  if (!p.name) return "Give the product a name.";
  if (p.name.length > 120) return "Keep the name under 120 characters.";
  if (p.identity.length > 120) return "Keep \"what it is\" under 120 characters.";
  if (p.makes !== null && !(p.makes >= 1 && p.makes <= 100000)) return "\"Makes\" should be a whole number, like 5.";
  return undefined;
}

export async function saveProduct(_prev: ProductFormState, form: FormData): Promise<ProductFormState> {
  const p = readForm(form);
  const err = check(p);
  if (err) return { error: err };
  const supabase = await createClient();
  const row = { name: p.name, type_key: p.type_key, identity: p.identity, makes: p.makes, recipe: p.recipe };

  if (p.id) {
    const { error } = await supabase.from("products").update(row).eq("id", p.id);
    if (error) return { error: "We couldn't save that. Try again in a moment." };
    revalidatePath("/app");
    revalidatePath(`/app/products/${p.id}`);
    return { saved: true };
  }

  const { data: member } = await supabase.from("business_members").select("business_id").limit(1).maybeSingle();
  if (!member) return { error: "Add your business details first." };
  const { data, error } = await supabase
    .from("products")
    .insert({ ...row, business_id: member.business_id })
    .select("id")
    .single();
  if (error || !data) return { error: "We couldn't save that. Try again in a moment." };
  revalidatePath("/app");
  redirect(`/app/products/${data.id}?saved=1`);
}

export async function deleteProduct(form: FormData) {
  const id = String(form.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) redirect("/app");
  if (String(form.get("confirm") ?? "").trim() !== "DELETE") redirect(`/app/products/${id}/manage`);
  const supabase = await createClient();
  await supabase.from("products").delete().eq("id", id);
  revalidatePath("/app");
  redirect("/app");
}
