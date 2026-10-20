import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { brand, pageTitle } from "@/lib/brand";
import { createClient } from "@/lib/supabase/server";
import { BrandMark } from "../BrandMark";
import { BusinessForm, type Business } from "./BusinessForm";
import { signOut } from "./actions";

export const metadata: Metadata = { title: pageTitle("Your shop") };
export const dynamic = "force-dynamic";

export default async function AppHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("businesses")
    .select("id, name, city_state_zip, contact")
    .limit(1)
    .maybeSingle();
  const business = (data as Business | null) ?? null;

  return (
    <main className="wrap narrow">
      <div className="topbar">
        <BrandMark href="/" />
        <form action={signOut}>
          <button className="btn ghost sm">Sign out</button>
        </form>
      </div>

      {business ? (
        <>
          <h1>{business.name}</h1>
          <p className="lead">Signed in as {user.email}.</p>
          <section className="card" aria-labelledby="next">
            <h2 id="next">Coming next</h2>
            <p>Your products, sizes and labels will live here.</p>
          </section>
          <h2 className="section">Your business details</h2>
          <BusinessForm business={business} />
        </>
      ) : (
        <>
          <h1>Welcome to {brand.name}</h1>
          <p className="lead">First, tell us about your business. This goes on every label, and you only enter it once.</p>
          <BusinessForm business={null} />
        </>
      )}
    </main>
  );
}
