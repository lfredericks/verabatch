import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { pageTitle } from "@/lib/brand";
import { createClient } from "@/lib/supabase/server";
import { BrandMark } from "../../BrandMark";
import { TabBar } from "../TabBar";

export const metadata: Metadata = { title: pageTitle("Batches") };
export const dynamic = "force-dynamic";

interface Row {
  id: string;
  lot: string;
  made_on: string;
  product_id: string;
  products: { name: string } | null;
}

const day = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/** Batches tab: everything made, newest first; look up a lot number; I made a batch. */
export default async function BatchesTab({ searchParams }: { searchParams: Promise<{ lot?: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const lot = String((await searchParams).lot ?? "").trim().slice(0, 40);

  let q = supabase
    .from("batches")
    .select("id, lot, made_on, product_id, products(name)")
    .order("made_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);
  if (lot) q = q.ilike("lot", `%${lot.replace(/[%_]/g, "")}%`);
  const { data } = await q;
  const batches = (data ?? []) as unknown as Row[];

  return (
    <main className="wrap narrow has-tabs">
      <BrandMark href="/app" />
      <div className="tabhead">
        <h1>Batches</h1>
        <p className="hint">Everything you&rsquo;ve made, newest first.</p>
      </div>

      <form className="lookup" role="search" action="/app/batches">
        <label htmlFor="lot" className="sr-only">
          Look up a lot number
        </label>
        <input id="lot" name="lot" type="search" defaultValue={lot} placeholder="Look up a lot number" />
        <button className="btn">Find</button>
      </form>

      {batches.length > 0 ? (
        <ul className="rows">
          {batches.map((b) => (
            <li key={b.id}>
              <Link href={`/app/products/${b.product_id}/batches/${b.id}`}>
                <span className="row-main">
                  <b>{b.products?.name ?? "Product"}</b>
                  <span>Lot {b.lot}</span>
                </span>
                <span className="hint">{day(b.made_on)}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : lot ? (
        <p>
          No batch with a lot number like &ldquo;{lot}&rdquo;. <Link href="/app/batches">Show all batches</Link>
        </p>
      ) : (
        <p>No batches yet. Logging batches is optional: it gives each batch its own lot number on the label.</p>
      )}

      <div className="bottom-cta">
        <Link href="/app/batches/new" className="btn pri big">
          I made a batch
        </Link>
      </div>
      <TabBar active="batches" />
    </main>
  );
}
