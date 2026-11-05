import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { pageTitle } from "@/lib/brand";
import { createClient } from "@/lib/supabase/server";
import { Onboarding } from "../../Onboarding";
import { PlanNote } from "../../PlanNote";
import { atProductLimit, planInfo, PRODUCT_LIMIT_TEXT } from "@/lib/planServer";

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
      {atProductLimit(await planInfo(supabase)) ? (
        <PlanNote title="One product on Free" text={PRODUCT_LIMIT_TEXT} back="/app" />
      ) : (
        <Onboarding needsBusiness={false} />
      )}
    </main>
  );
}
