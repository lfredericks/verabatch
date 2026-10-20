"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface BusinessFormState {
  error?: string;
  saved?: boolean;
}

function readBusiness(form: FormData) {
  return {
    name: String(form.get("name") ?? "").trim(),
    cityStateZip: String(form.get("city_state_zip") ?? "").trim(),
    contact: String(form.get("contact") ?? "").trim(),
  };
}

function check(b: ReturnType<typeof readBusiness>): string | undefined {
  if (!b.name) return "Enter your business name.";
  if (b.name.length > 120) return "Keep the business name under 120 characters.";
  if (b.cityStateZip.length > 120) return "Keep the city, state and ZIP under 120 characters.";
  if (b.contact.length > 200) return "Keep the contact under 200 characters.";
  return undefined;
}

export async function createBusiness(_prev: BusinessFormState, form: FormData): Promise<BusinessFormState> {
  const b = readBusiness(form);
  const err = check(b);
  if (err) return { error: err };
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_business", {
    p_name: b.name,
    p_city_state_zip: b.cityStateZip,
    p_contact: b.contact,
  });
  if (error) return { error: "We couldn't save that. Try again in a moment." };
  revalidatePath("/app");
  return { saved: true };
}

export async function updateBusiness(_prev: BusinessFormState, form: FormData): Promise<BusinessFormState> {
  const id = String(form.get("id") ?? "");
  const b = readBusiness(form);
  const err = check(b);
  if (err) return { error: err };
  const supabase = await createClient();
  const { error } = await supabase
    .from("businesses")
    .update({ name: b.name, city_state_zip: b.cityStateZip, contact: b.contact })
    .eq("id", id);
  if (error) return { error: "We couldn't save that. Try again in a moment." };
  revalidatePath("/app");
  return { saved: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
