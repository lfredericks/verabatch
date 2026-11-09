import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { pageTitle } from "@/lib/brand";
import { createClient } from "@/lib/supabase/server";
import { logoUrl } from "@/lib/logos";
import { planInfo } from "@/lib/planServer";
import { FREE_LIMITS } from "@/lib/plans";
import { BrandMark } from "../../BrandMark";
import { BusinessForm, type Business } from "../BusinessForm";
import { LogoField } from "../LogoField";
import { PasswordField } from "../PasswordField";
import { signOut } from "../actions";
import { TabBar } from "../TabBar";

export const metadata: Metadata = { title: pageTitle("My shop") };
export const dynamic = "force-dynamic";

const Chev = () => (
  <svg className="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 5l7 7-7 7" />
  </svg>
);

/** My shop tab: plan, shop details, logo, Canva, signing in, sign out. */
export default async function ShopTab({ searchParams }: { searchParams: Promise<{ password?: string }> }) {
  const { password } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await supabase.from("businesses").select("id, name, city_state_zip, contact, logo_path").limit(1).maybeSingle();
  if (!data) redirect("/app");
  const business = data as Business & { logo_path?: string | null };
  const businessLogo = await logoUrl(supabase, business.logo_path ?? null);
  const plan = await planInfo(supabase);
  const { data: canva } = await supabase.from("canva_connections").select("user_id").eq("user_id", user.id).maybeSingle();

  return (
    <main className="wrap narrow has-tabs">
      <BrandMark href="/app" />
      <div className="tabhead">
        <h1>{business.name}</h1>
        {business.city_state_zip && <p className="hint">{business.city_state_zip}</p>}
      </div>

      <section className="planbox" aria-label="Plan">
        <span className="row-main">
          <b>{plan?.plan === "pro" ? "Pro plan" : "Free plan"}</b>
          <span>
            {plan?.plan === "pro"
              ? "Unlimited products and batches."
              : `${Math.min(plan?.products ?? 0, FREE_LIMITS.products)} of ${FREE_LIMITS.products} product · ${Math.min(plan?.batches ?? 0, FREE_LIMITS.batches)} of ${FREE_LIMITS.batches} batches. Pro opens at launch.`}
          </span>
        </span>
      </section>

      <ul className="rows">
        <li>
          <details>
            <summary>
              <span className="row-main">
                <b>Shop details</b>
                <span>Name, address and contact for your labels</span>
              </span>
              <Chev />
            </summary>
            <div className="row-body">
              <BusinessForm business={business} />
            </div>
          </details>
        </li>
        <li>
          <details>
            <summary>
              <span className="row-main">
                <b>Logo</b>
                <span>{businessLogo ? "Goes on the front of your labels" : "None yet"}</span>
              </span>
              <Chev />
            </summary>
            <div className="row-body">
              <LogoField title="Business logo" url={businessLogo} note="No logo yet. It goes on the front of your labels unless a product has its own." />
            </div>
          </details>
        </li>
        <li>
          <details>
            <summary>
              <span className="row-main">
                <b>Canva</b>
                <span className={canva ? "st-ok" : undefined}>{canva ? "Connected" : "Not connected yet"}</span>
              </span>
              <Chev />
            </summary>
            <div className="row-body">
              <p className="hint">
                {canva
                  ? "Open in Canva on any label page sends the label straight to your Canva."
                  : "It connects the first time you tap Open in Canva on a label page."}
              </p>
            </div>
          </details>
        </li>
        <li>
          <details open={password === "reset"}>
            <summary>
              <span className="row-main">
                <b>Signing in</b>
                <span>Email code, password or Google</span>
              </span>
              <Chev />
            </summary>
            <div className="row-body">
              <PasswordField email={user.email ?? ""} reset={password === "reset"} />
            </div>
          </details>
        </li>
      </ul>

      <p className="hint">
        Questions? Email <a href="mailto:hello@verabatch.com">hello@verabatch.com</a>. <Link href="/disclaimer">Disclaimer</Link>
      </p>

      <form action={signOut} className="bottom-cta">
        <button className="btn">Sign out</button>
      </form>
      <TabBar active="shop" />
    </main>
  );
}
