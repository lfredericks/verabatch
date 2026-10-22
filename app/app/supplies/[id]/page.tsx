import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { pageTitle } from "@/lib/brand";
import type { Supply } from "@/lib/supplies";
import { createClient } from "@/lib/supabase/server";
import { BrandMark } from "../../../BrandMark";
import { DangerDelete } from "../../DangerDelete";
import { deleteSupply, setUsedUp } from "../actions";
import { SupplyForm } from "../SupplyForm";

export const metadata: Metadata = { title: pageTitle("Supply") };
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{36}$/i;

interface UsedIn {
  line_key: string;
  batches: { id: string; lot: string; made_on: string; product_id: string; products: { name: string } | null } | null;
}

export default async function SupplyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { error } = await searchParams;
  const [{ data }, { data: links }] = await Promise.all([
    supabase.from("supplies").select("*").eq("id", id).maybeSingle(),
    supabase.from("batch_supplies").select("line_key, batches(id, lot, made_on, product_id, products(name))").eq("supply_id", id),
  ]);
  if (!data) notFound();
  const supply = data as Supply;
  let invoiceUrl: string | null = null;
  if (supply.invoice_id) {
    const { data: inv } = await supabase.from("invoices").select("file_path").eq("id", supply.invoice_id).maybeSingle();
    if (inv?.file_path) invoiceUrl = (await supabase.storage.from("invoices").createSignedUrl(inv.file_path as string, 60 * 60)).data?.signedUrl ?? null;
  }
  // One row per batch (a lot can feed two lines of the same batch).
  const seen = new Set<string>();
  const usedIn = ((links ?? []) as unknown as UsedIn[])
    .map((l) => l.batches)
    .filter((b): b is NonNullable<UsedIn["batches"]> => Boolean(b) && !seen.has(b!.id) && Boolean(seen.add(b!.id)))
    .sort((a, b) => b.made_on.localeCompare(a.made_on));

  return (
    <main className="wrap narrow">
      <BrandMark href="/app" />
      <div>
        <p className="eyebrow">
          <Link href="/app/supplies">Supplies</Link>
          {supply.used_up && " · used up"}
        </p>
        <h1>{supply.ingredient}</h1>
      </div>
      <SupplyForm supply={supply} invoiceUrl={invoiceUrl} />

      <section className="card" aria-labelledby="used">
        <h2 id="used">Used in</h2>
        {usedIn.length ? (
          <ul className="plist">
            {usedIn.map((b) => (
              <li key={b.id}>
                <Link href={`/app/products/${b.product_id}/batches/${b.id}`}>
                  <b className="mono">{b.lot}</b>
                  <span>
                    {b.products?.name ?? "Product"} ·{" "}
                    {new Date(`${b.made_on}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="hint">No batches yet. When you log a batch, pick this lot on the line it went into.</p>
        )}
      </section>

      <form action={setUsedUp} className="row">
        <input type="hidden" name="id" value={supply.id} />
        <input type="hidden" name="used_up" value={supply.used_up ? "0" : "1"} />
        <button className="btn sm cta">{supply.used_up ? "Put back on hand" : "Mark used up"}</button>
        <span className="hint">{supply.used_up ? "It's hidden from new batches." : "Used-up lots stop showing up when you log a batch."}</span>
      </form>

      <section className="card danger-zone" aria-labelledby="danger">
        <h2 id="danger">Delete</h2>
        {error === "used" || usedIn.length ? (
          <p className="hint">
            This lot went into {usedIn.length === 1 ? "a batch" : "batches"}, so it can&rsquo;t be deleted. That keeps the trace for a recall. Mark it used up
            instead.
          </p>
        ) : (
          <DangerDelete
            action={deleteSupply}
            fields={{ id: supply.id }}
            label="Delete this supply"
            what={`${supply.ingredient}${supply.supplier_lot ? ` (lot ${supply.supplier_lot})` : ""}`}
            consequences={["Removes this supplier lot and its details."]}
          />
        )}
      </section>
    </main>
  );
}
