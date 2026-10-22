"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RecipeLine } from "@/lib/core";
import { CHANNELS, cleanDescriptions, MAX_DESCRIPTION, type ChannelKey } from "@/lib/channels";
import { activePack } from "@/lib/packs";
import { effectiveRecipe } from "@/lib/productData";
import { cleanRecipe } from "@/lib/products";
import { createClient } from "@/lib/supabase/server";
import { diffRecipe, ensureKeys, newKey } from "@/lib/variations";

export interface ProductFormState {
  error?: string;
  saved?: boolean;
}

const UUID = /^[0-9a-f-]{36}$/i;

/** How a saved recipe change is applied. */
type Mode = "master" | "variation" | "standalone";

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
  const rawMode = form.get("mode");
  const mode = String(rawMode ?? "master");
  return {
    /** Pages from before the save prompt existed don't send a mode. */
    modeSent: rawMode !== null,
    id: String(form.get("id") ?? ""),
    name: String(form.get("name") ?? "").trim(),
    newName: String(form.get("new_name") ?? "").trim(),
    mode: (["master", "variation", "standalone"].includes(mode) ? mode : "master") as Mode,
    type_key: pack.productTypes.some((t) => t.key === typeKey) || typeKey === "other" ? typeKey : "",
    identity: String(form.get("identity") ?? "").trim(),
    makes,
    recipe: cleanRecipe(recipe),
  };
}

function check(p: ReturnType<typeof readForm>): string | undefined {
  // Name, type and "what it is" of an existing product are saved by saveProductInfo.
  if (!p.id && !p.name) return "Give the product a name.";
  if (p.name.length > 120 || p.newName.length > 120) return "Keep the name under 120 characters.";
  if (p.identity.length > 120) return "Keep \"what it is\" under 120 characters.";
  if (p.makes !== null && !(p.makes >= 1 && p.makes <= 100000)) return "\"Makes\" should be a whole number, like 5.";
  if (p.mode !== "master" && !p.newName) return "Give the new recipe a name.";
  return undefined;
}

/** Keys for new lines; lines from before keys existed keep their position keys. */
function withKeys(lines: RecipeLine[]): RecipeLine[] {
  return lines.map((l) => (l.key ? l : { ...l, key: newKey() }));
}

/** Copy a product's sizes to a new product, so the new one has labels right away. */
async function copySizes(supabase: SupabaseClient, fromId: string, toId: string) {
  const { data: sizes } = await supabase
    .from("sizes")
    .select("name, fill_amount, fill_unit, label_shape, width_in, height_in, diameter_in, position")
    .eq("product_id", fromId);
  if (sizes?.length) await supabase.from("sizes").insert(sizes.map((s) => ({ ...s, product_id: toId })));
}

export async function saveProduct(_prev: ProductFormState, form: FormData): Promise<ProductFormState> {
  const p = readForm(form);
  const err = check(p);
  if (err) return { error: err };
  if (p.id && !UUID.test(p.id)) return { error: "Something went wrong. Reload the page and try again." };
  const supabase = await createClient();
  const base = { type_key: p.type_key, identity: p.identity, makes: p.makes };

  // New product.
  if (!p.id) {
    const { data: member } = await supabase.from("business_members").select("business_id").limit(1).maybeSingle();
    if (!member) return { error: "Add your business details first." };
    const { data, error } = await supabase
      .from("products")
      .insert({ ...base, name: p.name, recipe: withKeys(p.recipe), business_id: member.business_id })
      .select("id")
      .single();
    if (error || !data) return { error: "We couldn't save that. Try again in a moment." };
    revalidatePath("/app");
    redirect(`/app/products/${data.id}?saved=1`);
  }

  const { data: current } = await supabase
    .from("products")
    .select("id, name, type_key, identity, recipe, parent_id, changes, business_id")
    .eq("id", p.id)
    .maybeSingle();
  if (!current) return { error: "That product is gone. Go back and reload." };

  // Save as a new recipe: a linked variation, or an independent copy.
  if (p.mode !== "master") {
    const { lines: currentRecipe, parent } = await effectiveRecipe(supabase, current);
    // A variation of a variation hangs off the same parent (one level only).
    const parentId = parent ? parent.id : current.id;
    const parentRecipe = parent ? parent.recipe : currentRecipe;
    // The new recipe starts with this product's type and "what it is".
    const fromCurrent = { type_key: current.type_key, identity: current.identity, makes: p.makes };
    const row =
      p.mode === "variation"
        ? { ...fromCurrent, name: p.newName, parent_id: parentId, recipe: [], changes: diffRecipe(parentRecipe, p.recipe) }
        : { ...fromCurrent, name: p.newName, recipe: p.recipe.map((l) => ({ ...l, key: newKey() })) };
    const { data, error } = await supabase
      .from("products")
      .insert({ ...row, business_id: current.business_id })
      .select("id")
      .single();
    if (error || !data) return { error: "We couldn't save that. Try again in a moment." };
    await copySizes(supabase, current.id, data.id as string);
    revalidatePath("/app");
    redirect(`/app/products/${data.id}?saved=1`);
  }

  // An out-of-date page (no save prompt) must never overwrite a recipe without asking.
  if (!p.modeSent) return { error: "This page is out of date. Reload the page, then make your change again." };

  // Update this product. A variation stores its differences from the parent.
  let recipeFields: Record<string, unknown>;
  if (current.parent_id) {
    const { parent } = await effectiveRecipe(supabase, current);
    recipeFields = parent ? { changes: diffRecipe(parent.recipe, p.recipe) } : { recipe: withKeys(p.recipe) };
  } else {
    // Keep existing line keys stable so variations keep pointing at the right lines.
    const stored = ensureKeys(cleanRecipe(current.recipe));
    const known = new Set(stored.map((l) => l.key));
    recipeFields = { recipe: p.recipe.map((l) => (l.key && known.has(l.key) ? l : { ...l, key: newKey() })) };
  }
  const { data: updated, error } = await supabase
    .from("products")
    .update({ makes: p.makes, ...recipeFields })
    .eq("id", p.id)
    .select("id, type_key");
  if (error) return { error: "We couldn't save that. Try again in a moment." };
  // An update that touched no rows is a failure, not a success.
  if (!updated?.length) return { error: "That didn't save. Reload the page and try again." };
  revalidatePath("/app");
  revalidatePath(`/app/products/${p.id}`);
  return { saved: true };
}

export interface InfoFormState {
  error?: string;
  saved?: number;
}

/** Name, kind of product and "what it is" — edited on their own, behind an Edit button. */
export async function saveProductInfo(_prev: InfoFormState, form: FormData): Promise<InfoFormState> {
  const pack = activePack();
  const id = String(form.get("id") ?? "");
  const name = String(form.get("name") ?? "").trim();
  const typeKey = String(form.get("type_key") ?? "").trim();
  const identity = String(form.get("identity") ?? "").trim();
  if (!UUID.test(id)) return { error: "Something went wrong. Reload the page and try again." };
  if (!name) return { error: "Give the product a name." };
  if (name.length > 120) return { error: "Keep the name under 120 characters." };
  if (identity.length > 120) return { error: "Keep \"what it is\" under 120 characters." };
  const type_key = pack.productTypes.some((t) => t.key === typeKey) || typeKey === "other" ? typeKey : "";
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").update({ name, type_key, identity }).eq("id", id).select("id");
  if (error || !data?.length) return { error: "That didn't save. Reload the page and try again." };
  revalidatePath("/app");
  revalidatePath(`/app/products/${id}`);
  return { saved: Date.now() };
}

/** Variations become standalone products, keeping the recipe they have right now. */
async function detachChildren(supabase: SupabaseClient, parentId: string) {
  const { data: kids } = await supabase.from("products").select("id, name, recipe, parent_id, changes").eq("parent_id", parentId);
  for (const k of kids ?? []) {
    const { lines } = await effectiveRecipe(supabase, k);
    await supabase.from("products").update({ parent_id: null, changes: [], recipe: lines }).eq("id", k.id);
  }
}

export async function detachVariation(form: FormData) {
  const id = String(form.get("id") ?? "");
  if (!UUID.test(id)) redirect("/app");
  const supabase = await createClient();
  const { data: p } = await supabase.from("products").select("id, name, recipe, parent_id, changes").eq("id", id).maybeSingle();
  if (p?.parent_id) {
    const { lines } = await effectiveRecipe(supabase, p);
    await supabase.from("products").update({ parent_id: null, changes: [], recipe: lines }).eq("id", id);
  }
  revalidatePath("/app");
  redirect(`/app/products/${id}?saved=1`);
}

export async function deleteProduct(form: FormData) {
  const id = String(form.get("id") ?? "");
  if (!UUID.test(id)) redirect("/app");
  if (String(form.get("confirm") ?? "").trim() !== "DELETE") redirect(`/app/products/${id}/manage`);
  const supabase = await createClient();
  await detachChildren(supabase, id);
  await supabase.from("products").delete().eq("id", id);
  revalidatePath("/app");
  redirect("/app");
}

export interface DescriptionState {
  error?: string;
  saved?: number;
}

/** Save one channel's description (Etsy, website, Amazon, other). Empty text removes it. */
export async function saveDescription(_prev: DescriptionState, form: FormData): Promise<DescriptionState> {
  const id = String(form.get("id") ?? "");
  const channel = String(form.get("channel") ?? "");
  const text = String(form.get("text") ?? "").replace(/\r\n/g, "\n").trim();
  if (!UUID.test(id) || !CHANNELS.some((c) => c.key === channel)) return { error: "Something went wrong. Reload the page and try again." };
  if (text.length > MAX_DESCRIPTION) return { error: `Keep it under ${MAX_DESCRIPTION.toLocaleString()} characters.` };
  const supabase = await createClient();
  const { data: current } = await supabase.from("products").select("descriptions").eq("id", id).maybeSingle();
  if (!current) return { error: "That product is gone. Go back and reload." };
  const next = cleanDescriptions(current.descriptions);
  if (text) next[channel as ChannelKey] = text;
  else delete next[channel as ChannelKey];
  const { data, error } = await supabase.from("products").update({ descriptions: next }).eq("id", id).select("id");
  if (error || !data?.length) return { error: "That didn't save. Reload the page and try again." };
  revalidatePath(`/app/products/${id}`);
  return { saved: Date.now() };
}
