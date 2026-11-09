import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { pageTitle } from "@/lib/brand";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: pageTitle("Batch saved") };
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{36}$/i;

/** The win after logging a batch: its lot number, and labels for that lot. */
export default async function BatchSaved({ params }: { params: Promise<{ id: string; batchId: string }> }) {
  const { id, batchId } = await params;
  if (!UUID.test(id) || !UUID.test(batchId)) notFound();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: batch }, { data: product }, { count }] = await Promise.all([
    supabase.from("batches").select("id, lot, made_on").eq("id", batchId).eq("product_id", id).maybeSingle(),
    supabase.from("products").select("name").eq("id", id).maybeSingle(),
    supabase.from("batch_supplies").select("supply_id", { count: "exact", head: true }).eq("batch_id", batchId),
  ]);
  if (!batch || !product) notFound();

  return (
    <main className="wrap narrow">
      <div className="done">
        <span className="tick" aria-hidden="true">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5 9-10" />
          </svg>
        </span>
        <h1>Batch saved</h1>
        <p className="hint">{product.name}</p>
        <p className="lotno">Lot {batch.lot}</p>
        <p className="hint">
          {count
            ? "Its ingredients are traced to their deliveries, in case a supplier ever has a recall."
            : "Print this lot number on its labels. Track deliveries under Supplies to trace a recall."}
        </p>
      </div>
      <div className="bottom-cta">
        <Link href={`/app/products/${id}/label?batch=${batchId}`} className="btn pri big">
          Get labels for this lot
        </Link>
        <Link href="/app/batches" className="btn ghost cta center-self">
          Done
        </Link>
      </div>
    </main>
  );
}
