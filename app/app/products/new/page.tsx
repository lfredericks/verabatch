import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { pageTitle } from "@/lib/brand";
import { createClient } from "@/lib/supabase/server";
import { Onboarding } from "../../Onboarding";

export const metadata: Metadata = { title: pageTitle("Add a product") };
export const dynamic = "force-dynamic";

export default async function NewProduct() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: business } = await supabase.from("businesses").select("id").limit(1).maybeSingle();
  if (!business) redirect("/app");

  return (
    <main className="wrap narrow">
      <Onboarding needsBusiness={false} />
    </main>
  );
}
