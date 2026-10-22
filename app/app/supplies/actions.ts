"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { readSupplyForm } from "@/lib/supplies";
import { createClient } from "@/lib/supabase/server";

export interface SupplyFormState {
  error?: string;
  saved?: number;
}

const UUID = /^[0-9a-f-]{36}$/i;

export async function saveSupply(_prev: SupplyFormState, form: FormData): Promise<SupplyFormState> {
  const r = readSupplyForm(form);
  if ("error" in r) return { error: r.error };
  const supabase = await createClient();

  if (r.id) {
    if (!UUID.test(r.id)) return { error: "Something went wrong. Reload the page and try again." };
    const { data, error } = await supabase.from("supplies").update(r.row).eq("id", r.id).select("id");
    if (error || !data?.length) return { error: "That didn't save. Reload the page and try again." };
    revalidatePath("/app/supplies");
    revalidatePath(`/app/supplies/${r.id}`);
    return { saved: Date.now() };
  }

  const { data: member } = await supabase.from("business_members").select("business_id").limit(1).maybeSingle();
  if (!member) return { error: "Add your business details first." };
  const { data, error } = await supabase
    .from("supplies")
    .insert({ ...r.row, business_id: member.business_id })
    .select("id")
    .single();
  if (error || !data) return { error: "We couldn't save that. Try again in a moment." };
  revalidatePath("/app/supplies");
  redirect(`/app/supplies?added=${data.id}`);
}

/** Mark a supply lot used up (it stops being offered for new batches), or open it again. */
export async function setUsedUp(form: FormData) {
  const id = String(form.get("id") ?? "");
  if (!UUID.test(id)) redirect("/app/supplies");
  const supabase = await createClient();
  await supabase.from("supplies").update({ used_up: form.get("used_up") === "1" }).eq("id", id);
  revalidatePath("/app/supplies");
  revalidatePath(`/app/supplies/${id}`);
  redirect(`/app/supplies/${id}`);
}

/** Delete a supply lot. Only lots no batch used: the database refuses the rest, so the trace is kept. */
export async function deleteSupply(form: FormData) {
  const id = String(form.get("id") ?? "");
  if (!UUID.test(id)) redirect("/app/supplies");
  if (String(form.get("confirm") ?? "").trim() !== "DELETE") redirect(`/app/supplies/${id}`);
  const supabase = await createClient();
  const { error } = await supabase.from("supplies").delete().eq("id", id);
  if (error) redirect(`/app/supplies/${id}?error=used`);
  revalidatePath("/app/supplies");
  redirect("/app/supplies");
}
