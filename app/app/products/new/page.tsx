import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { pageTitle } from "@/lib/brand";
import { createClient } from "@/lib/supabase/server";
import { BrandMark } from "../../../BrandMark";
import { ProductEditor } from "../ProductEditor";

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
      <BrandMark href="/app" />
      <h1>Add a product</h1>
      <ProductEditor product={null} />
    </main>
  );
}
