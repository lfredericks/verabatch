import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { pageTitle } from "@/lib/brand";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: pageTitle("What did you make?") };
export const dynamic = "force-dynamic";

/** First step of logging a batch from the Batches tab: pick the product. */
export default async function PickProduct() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: products } = await supabase.from("products").select("id, name").order("name");
  const list = products ?? [];
  if (list.length === 1) redirect(`/app/products/${list[0]!.id}/batches/new`);
  const { data: last } = await supabase.from("batches").select("product_id, made_on").order("made_on", { ascending: false }).limit(500);
  const lastMade = new Map<string, string>();
  for (const b of last ?? []) if (!lastMade.has(b.product_id as string)) lastMade.set(b.product_id as string, b.made_on as string);

  return (
    <main className="wrap narrow">
      <div className="ob-top">
        <Link href="/app/batches" className="ob-icon" aria-label="Back">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>
      </div>
      <h1>What did you make?</h1>
      {list.length ? (
        <div className="tiles2">
          {list.map((p) => {
            const d = lastMade.get(p.id as string);
            return (
              <Link key={p.id} href={`/app/products/${p.id}/batches/new`} className="tile">
                <b>{p.name}</b>
                <span>{d ? `Last made ${new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "Not made yet"}</span>
              </Link>
            );
          })}
        </div>
      ) : (
        <p>
          Add a product first. <Link href="/app/products/new">Add a product</Link>
        </p>
      )}
    </main>
  );
}
