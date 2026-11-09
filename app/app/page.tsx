import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { pageTitle } from "@/lib/brand";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/products";
import { productStatuses } from "@/lib/productStatus";
import { planInfo } from "@/lib/planServer";
import { FREE_LIMITS } from "@/lib/plans";
import { BrandMark } from "../BrandMark";
import { Onboarding } from "./Onboarding";
import { TabBar } from "./TabBar";

export const metadata: Metadata = { title: pageTitle("Your products") };
export const dynamic = "force-dynamic";

const Chev = () => (
  <svg className="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 5l7 7-7 7" />
  </svg>
);

/** Products tab: the home screen. Each product with its status, and Add a product. */
export default async function ProductsTab({ searchParams }: { searchParams: Promise<{ password?: string }> }) {
  const { password } = await searchParams;
  if (password === "reset") redirect("/app/shop?password=reset#signin");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase.from("businesses").select("id, name, city_state_zip, contact").limit(1).maybeSingle();
  if (!business) {
    return (
      <main className="wrap narrow">
        <Onboarding needsBusiness />
      </main>
    );
  }

  const plan = await planInfo(supabase);
  const { data } = await supabase.from("products").select("*").order("name");
  const products = (data ?? []) as (Product & { parent_id?: string | null })[];
  const status = await productStatuses(supabase, products, business);
  const top = products.filter((p) => !p.parent_id || !products.some((x) => x.id === p.parent_id));
  const atLimit = plan?.plan === "free" && plan.products >= FREE_LIMITS.products;

  return (
    <main className="wrap narrow has-tabs">
      <BrandMark href="/app" />
      <div className="tabhead">
        <h1>Your products</h1>
      </div>

      {top.length > 0 ? (
        <ul className="rows">
          {top.map((p) => {
            const kids = products.filter((k) => k.parent_id === p.id);
            const st = status[p.id];
            return (
              <li key={p.id}>
                <Link href={`/app/products/${p.id}`}>
                  <span className="row-main">
                    <b>{p.name}</b>
                    {st && <span className={st.tone === "ok" ? "st-ok" : st.tone === "warn" ? "st-warn" : undefined}>{st.text}</span>}
                  </span>
                  <Chev />
                </Link>
                {kids.map((k) => (
                  <Link key={k.id} href={`/app/products/${k.id}`} className="variation">
                    <span className="row-main">
                      <b>{k.name}</b>
                      <span>Variation{status[k.id] ? ` · ${status[k.id]!.text}` : ""}</span>
                    </span>
                    <Chev />
                  </Link>
                ))}
              </li>
            );
          })}
        </ul>
      ) : (
        <p>Add your first product: its name and the recipe the way you make it.</p>
      )}

      {products.length > 0 && (
        <Link href="/app/library" className="cta">
          See them all as a spreadsheet
        </Link>
      )}
      {plan?.plan === "free" && (
        <p className="hint">
          Free plan: {Math.min(plan.products, FREE_LIMITS.products)} of {FREE_LIMITS.products} product,{" "}
          {Math.min(plan.batches, FREE_LIMITS.batches)} of {FREE_LIMITS.batches} batches. Pro (unlimited) opens at launch.
        </p>
      )}

      {!atLimit && (
        <div className="bottom-cta">
          <Link href="/app/products/new" className="btn pri big">
            Add a product
          </Link>
        </div>
      )}
      <TabBar active="products" />
    </main>
  );
}
