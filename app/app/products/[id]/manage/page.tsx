import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { countsText } from "@/lib/batches";
import { pageTitle } from "@/lib/brand";
import { createClient } from "@/lib/supabase/server";
import { BrandMark } from "../../../../BrandMark";
import { DangerDelete } from "../../../DangerDelete";
import { deleteProduct } from "../../actions";
import { deleteBatch } from "../../batchActions";

export const metadata: Metadata = { title: pageTitle("Manage product") };
export const dynamic = "force-dynamic";

const date = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/** Deleting lives here, away from everyday editing. */
export default async function ManageProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: product }, { data: sizes }, { data: batches }] = await Promise.all([
    supabase.from("products").select("id, name").eq("id", id).maybeSingle(),
    supabase.from("sizes").select("id, name").eq("product_id", id),
    supabase
      .from("batches")
      .select("id, lot, made_on, counts")
      .eq("product_id", id)
      .order("made_on", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);
  if (!product) notFound();
  const sizeNames = Object.fromEntries((sizes ?? []).map((s) => [s.id, s.name]));
  const nBatches = batches?.length ?? 0;
  const nSizes = sizes?.length ?? 0;

  return (
    <main className="wrap narrow">
      <BrandMark href="/app" />
      <div>
        <p className="eyebrow">Manage</p>
        <h1>{product.name}</h1>
      </div>

      <section className="card" aria-labelledby="mb">
        <h2 id="mb">Batches</h2>
        {nBatches ? (
          <ul className="plist">
            {batches!.map((b) => (
              <li key={b.id} className="manage-row">
                <div className="sizerow">
                  <div>
                    <b className="mono">{b.lot}</b>
                    <span>
                      {date(b.made_on)} · {countsText(b.counts as Record<string, number>, sizeNames)}
                    </span>
                  </div>
                </div>
                <DangerDelete
                  action={deleteBatch}
                  fields={{ id: b.id, product_id: product.id }}
                  label="Delete batch"
                  what={`batch ${b.lot}`}
                  consequences={[
                    "Its record, counts, note and recipe copy are gone.",
                    "Jars already labeled with this lot will have no record to trace back to.",
                    "The lot number may be reused by a new batch made the same day.",
                  ]}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="hint">No batches logged.</p>
        )}
      </section>

      <section className="card danger-zone" aria-labelledby="dz">
        <h2 id="dz">Delete this product</h2>
        <DangerDelete
          action={deleteProduct}
          fields={{ id: product.id }}
          label="Delete this product"
          what={product.name}
          consequences={[
            "The recipe and every label for it are gone.",
            `${nSizes} size${nSizes === 1 ? "" : "s"} will be deleted.`,
            `${nBatches} batch record${nBatches === 1 ? "" : "s"} and ${nBatches === 1 ? "its lot number" : "their lot numbers"} will be deleted.`,
          ]}
        />
      </section>

      <Link href={`/app/products/${product.id}`} className="btn ghost cta">
        Back to {product.name}
      </Link>
    </main>
  );
}
