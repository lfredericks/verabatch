"use server";

import { revalidatePath } from "next/cache";
import { LOGO_BUCKET, logoPath, readLogoFile } from "@/lib/logos";
import { createClient } from "@/lib/supabase/server";

export interface LogoState {
  error?: string;
  saved?: number;
}

const UUID = /^[0-9a-f-]{36}$/i;
const CONTENT_TYPE = { png: "image/png", jpg: "image/jpeg" } as const;

/** Which logo a form is about: the business's, or one product's. */
async function target(form: FormData) {
  const supabase = await createClient();
  const productId = String(form.get("product_id") ?? "");
  if (productId) {
    if (!UUID.test(productId)) return null;
    const { data } = await supabase.from("products").select("id, business_id, logo_path").eq("id", productId).maybeSingle();
    return data ? { supabase, table: "products" as const, id: data.id as string, businessId: data.business_id as string, old: data.logo_path as string | null, productId } : null;
  }
  const { data } = await supabase.from("businesses").select("id, logo_path").limit(1).maybeSingle();
  return data ? { supabase, table: "businesses" as const, id: data.id as string, businessId: data.id as string, old: data.logo_path as string | null } : null;
}

function refresh(productId?: string) {
  revalidatePath("/app");
  if (productId) revalidatePath(`/app/products/${productId}`);
}

export async function saveLogo(_prev: LogoState, form: FormData): Promise<LogoState> {
  const file = await readLogoFile(form.get("logo"));
  if ("error" in file) return { error: file.error };
  const t = await target(form);
  if (!t) return { error: "Something went wrong. Reload the page and try again." };

  const path = logoPath(t.businessId, file.kind, t.table === "products" ? t.id : undefined);
  const { error: upErr } = await t.supabase.storage
    .from(LOGO_BUCKET)
    .upload(path, file.bytes, { contentType: CONTENT_TYPE[file.kind], upsert: false });
  if (upErr) return { error: "We couldn't upload that. Try again in a moment." };

  const { data, error } = await t.supabase.from(t.table).update({ logo_path: path }).eq("id", t.id).select("id");
  if (error || !data?.length) {
    await t.supabase.storage.from(LOGO_BUCKET).remove([path]);
    return { error: "That didn't save. Reload the page and try again." };
  }
  if (t.old) await t.supabase.storage.from(LOGO_BUCKET).remove([t.old]);
  refresh(t.table === "products" ? t.id : undefined);
  return { saved: Date.now() };
}

export async function removeLogo(_prev: LogoState, form: FormData): Promise<LogoState> {
  const t = await target(form);
  if (!t) return { error: "Something went wrong. Reload the page and try again." };
  const { error } = await t.supabase.from(t.table).update({ logo_path: null }).eq("id", t.id);
  if (error) return { error: "That didn't save. Reload the page and try again." };
  if (t.old) await t.supabase.storage.from(LOGO_BUCKET).remove([t.old]);
  refresh(t.table === "products" ? t.id : undefined);
  return { saved: Date.now() };
}
