import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { pageTitle } from "@/lib/brand";
import { lookupLot } from "@/lib/lotLookup";
import { createClient } from "@/lib/supabase/server";
import { BrandMark } from "../../../BrandMark";

export const metadata: Metadata = { title: pageTitle("Look up a lot number") };
export const dynamic = "force-dynamic";

const day = (d: string | null) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");

/** A supplier sends a recall notice: type their lot number, see every batch it went into. */
export default async function LookupPage({ searchParams }: { searchParams: Promise<{ lot?: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const lot = ((await searchParams).lot ?? "").trim().slice(0, 60);
  const hits = lot ? await lookupLot(supabase, lot) : [];
  const batchCount = new Set(hits.flatMap((h) => h.batches.map((b) => b.id))).size;

  return (
    <main className="wrap narrow">
      <BrandMark href="/app" />
      <div>
        <p className="eyebrow">
          <Link href="/app/supplies">My supplies</Link>
        </p>
        <h1>Look up a supplier&rsquo;s lot number</h1>
        <p className="hint">For a recall notice. It&rsquo;s on the notice and on the container.</p>
      </div>
      <form className="searchrow" role="search">
        <label className="sr-only" htmlFor="lot">
          Lot number
        </label>
        <input id="lot" name="lot" defaultValue={lot} placeholder="Lot number" maxLength={60} autoFocus={!lot} />
        <button className="btn pri">Look up</button>
      </form>

      {lot && !hits.length && <p className="hint">No supply has a lot number like &ldquo;{lot}&rdquo;. Check the number, or look it up on the container.</p>}

      {hits.length > 0 && (
        <>
          <div className="bigtotal">
            <b>{batchCount}</b>
            <span>{batchCount === 1 ? "batch used it" : "batches used it"}</span>
          </div>
          {hits.map((h) => (
            <section key={h.supply.id} aria-label={h.supply.ingredient}>
              <h2>
                <Link href={`/app/supplies/${h.supply.id}`}>{h.supply.ingredient}</Link>
              </h2>
              <p className="hint">{[`Lot ${h.supply.supplier_lot}`, h.supply.supplier, day(h.supply.received_on)].filter(Boolean).join(" · ")}</p>
              {h.batches.length ? (
                <ul className="rows">
                  {h.batches.map((b) => (
                    <li key={b.id}>
                      <Link href={`/app/products/${b.product_id}/batches/${b.id}`}>
                        <span className="row-main">
                          <b className="mono">{b.lot}</b>
                          <span>
                            {b.product} · {day(b.made_on)}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="hint">No batches used this one.</p>
              )}
            </section>
          ))}
          {batchCount > 0 && (
            <>
              <a className="btn" href={`/app/supplies/lookup/csv?lot=${encodeURIComponent(lot)}`} download>
                Download this list
              </a>
              <p className="hint">Next, check your shop orders for these lot numbers to see who bought them.</p>
            </>
          )}
        </>
      )}
    </main>
  );
}
