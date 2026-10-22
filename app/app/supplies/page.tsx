import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { pageTitle } from "@/lib/brand";
import { amountText, type Supply } from "@/lib/supplies";
import { createClient } from "@/lib/supabase/server";
import { BrandMark } from "../../BrandMark";
import { AddSupply } from "./AddSupply";

export const metadata: Metadata = { title: pageTitle("Supplies") };
export const dynamic = "force-dynamic";

function SupplyRow({ s }: { s: Supply }) {
  const date = s.received_on
    ? new Date(`${s.received_on}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";
  return (
    <li>
      <Link href={`/app/supplies/${s.id}`}>
        <b>{s.ingredient}</b>
        <span>
          {[s.supplier, s.supplier_lot ? `lot ${s.supplier_lot}` : "", amountText(s), date ? `received ${date}` : ""].filter(Boolean).join(" · ")}
        </span>
      </Link>
    </li>
  );
}

export default async function SuppliesPage({ searchParams }: { searchParams: Promise<{ added?: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { added } = await searchParams;
  const { data } = await supabase
    .from("supplies")
    .select("*")
    .order("received_on", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(500);
  const supplies = (data ?? []) as Supply[];
  const open = supplies.filter((s) => !s.used_up);
  const usedUp = supplies.filter((s) => s.used_up);

  return (
    <main className="wrap narrow">
      <BrandMark href="/app" />
      <div>
        <p className="eyebrow">Supplies</p>
        <h1>Supplier lots</h1>
      </div>
      <p className="lead">
        Log each delivery with the supplier&rsquo;s lot number. When you log a batch, pick which lot went in, so a supplier recall can be traced to
        your batches.
      </p>
      {added && (
        <p className="ok" role="status">
          Added.
        </p>
      )}
      <AddSupply startOpen={supplies.length === 0} />
      {open.length > 0 && (
        <section className="card" aria-labelledby="open">
          <h2 id="open">On hand</h2>
          <ul className="plist">
            {open.map((s) => (
              <SupplyRow key={s.id} s={s} />
            ))}
          </ul>
        </section>
      )}
      {usedUp.length > 0 && (
        <details className="card">
          <summary>
            <h2 className="inline-h2">Used up ({usedUp.length})</h2>
          </summary>
          <ul className="plist">
            {usedUp.map((s) => (
              <SupplyRow key={s.id} s={s} />
            ))}
          </ul>
        </details>
      )}
      <Link href="/app" className="btn ghost cta">
        Back to your shop
      </Link>
    </main>
  );
}
