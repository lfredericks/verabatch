import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { pageTitle } from "@/lib/brand";
import { amountShort } from "@/lib/materials";
import { loadMaterials } from "@/lib/materialsServer";
import { createClient } from "@/lib/supabase/server";
import { BrandMark } from "../../../../BrandMark";
import { MaterialForm } from "./MaterialForm";

export const metadata: Metadata = { title: pageTitle("Supply") };
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{36}$/i;
const day = (d: string | null) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "No date");

interface Link_ {
  supply_id: string;
  batches: { id: string; lot: string; made_on: string; product_id: string; products: { name: string } | null } | null;
}

/** One supply (say Unrefined shea): the total on hand, each delivery oldest first, and where it went. */
export default async function MaterialPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ added?: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { added } = await searchParams;
  const { materials } = await loadMaterials(supabase);
  const m = materials.find((x) => x.id === id);
  if (!m) notFound();
  const ids = m.deliveries.map((d) => d.id);
  const { data: links } = await supabase
    .from("batch_supplies")
    .select("supply_id, batches(id, lot, made_on, product_id, products(name))")
    .in("supply_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  const seen = new Set<string>();
  const batches = ((links ?? []) as unknown as Link_[])
    .map((l) => l.batches)
    .filter((b): b is NonNullable<Link_["batches"]> => Boolean(b) && !seen.has(b!.id) && Boolean(seen.add(b!.id)))
    .sort((a, b) => b.made_on.localeCompare(a.made_on));
  const open = m.deliveries.filter((d) => !d.used_up);
  const gone = m.deliveries.filter((d) => d.used_up);
  const total = m.onHand?.unit ? amountShort(m.onHand.amount, m.onHand.unit) : null;

  return (
    <main className="wrap narrow">
      <BrandMark href="/app" />
      <div>
        <p className="eyebrow">
          <Link href="/app/supplies">My supplies</Link>
        </p>
        <h1>{m.name}</h1>
      </div>
      {added && (
        <p className="ok" role="status">
          Added. It&rsquo;s ready to pick when you make a batch.
        </p>
      )}

      <div className="bigtotal">
        <b>{total ?? (open.length ? "Some" : "None")}</b>
        <span>{total ? "on hand" : open.length ? "on hand. Add amounts to see how much." : "on hand"}</span>
        {m.shops.length > 1 && <span className="hint">From {m.shops.join(" and ")}</span>}
      </div>

      <section aria-labelledby="dl">
        <h2 id="dl">Deliveries</h2>
        <p className="hint">Oldest first. That&rsquo;s the one we pick first for a batch.</p>
        {open.length ? (
          <ul className="rows">
            {open.map((d) => (
              <li key={d.id}>
                <Link href={`/app/supplies/${d.id}`}>
                  <span className="row-main">
                    <b>{[d.supplier || "Shop not set", day(d.received_on)].join(" · ")}</b>
                    <span>
                      {[
                        d.left !== null && d.unit ? `${amountShort(d.left, d.unit)} left` : d.amount ? `${d.amount} ${d.unit}` : "",
                        d.supplier_lot ? `Lot ${d.supplier_lot}` : "",
                        d.organic ? "Organic" : "",
                      ]
                        .filter(Boolean)
                        .join(" · ") || "Tap to add details"}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="hint">Nothing on hand right now.</p>
        )}
        {gone.length > 0 && (
          <details>
            <summary className="hint">Used up ({gone.length})</summary>
            <ul className="rows">
              {gone.map((d) => (
                <li key={d.id}>
                  <Link href={`/app/supplies/${d.id}`}>
                    <span className="row-main">
                      <b>{[d.supplier || "Shop not set", day(d.received_on)].join(" · ")}</b>
                      <span>{d.supplier_lot ? `Lot ${d.supplier_lot}` : "Used up"}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <section aria-labelledby="went">
        <h2 id="went">Went into</h2>
        {batches.length ? (
          <ul className="rows">
            {batches.slice(0, 20).map((b) => (
              <li key={b.id}>
                <Link href={`/app/products/${b.product_id}/batches/${b.id}`}>
                  <span className="row-main">
                    <b className="mono">{b.lot}</b>
                    <span>
                      {b.products?.name ?? "Product"} · {day(b.made_on)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="hint">No batches yet. When you make a batch, we&rsquo;ll ask which one you used.</p>
        )}
      </section>

      <MaterialForm id={m.id} name={m.name} blend={m.blend ?? ""} note={m.note ?? ""} />

      <div className="bottom-cta">
        <Link href={`/app/supplies/add?material=${m.id}`} className="btn pri big">
          Add a delivery
        </Link>
      </div>
    </main>
  );
}
