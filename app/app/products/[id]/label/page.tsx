import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { pageTitle } from "@/lib/brand";
import { buildLabel } from "@/lib/label";
import { activePack } from "@/lib/packs";
import { cleanRecipe } from "@/lib/products";
import type { Size } from "@/lib/sizes";
import { createClient } from "@/lib/supabase/server";
import { BrandMark } from "../../../../BrandMark";
import { CopyButtons } from "./CopyButtons";

export const metadata: Metadata = { title: pageTitle("Label") };
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{36}$/i;

export default async function LabelPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ size?: string; batch?: string }>;
}) {
  const { id } = await params;
  const { size: sizeId, batch: batchParam } = await searchParams;
  if (!UUID.test(id)) notFound();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: product }, { data: sizeRows }, { data: biz }, { data: batchRows }] = await Promise.all([
    supabase.from("products").select("id, name, type_key, identity, makes, recipe").eq("id", id).maybeSingle(),
    supabase.from("sizes").select("*").eq("product_id", id).order("position").order("created_at"),
    supabase.from("businesses").select("name, city_state_zip, contact").limit(1).maybeSingle(),
    supabase
      .from("batches")
      .select("id, lot, made_on, recipe")
      .eq("product_id", id)
      .order("made_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  if (!product) notFound();

  const sizes = (sizeRows ?? []) as Size[];
  const size = sizes.find((s) => s.id === sizeId) ?? sizes[0] ?? null;
  const batches = batchRows ?? [];
  // Batches are optional: the label is the usual recipe with no lot unless a batch is picked.
  const batch = batches.find((b) => b.id === batchParam) ?? null;
  const link = (o: { size?: string | undefined; batch?: string | undefined }) => {
    const q = new URLSearchParams();
    const sz = o.size ?? size?.id;
    const bt = o.batch ?? (batch ? batch.id : "standard");
    if (sz) q.set("size", sz);
    if (bt) q.set("batch", bt);
    return `/app/products/${id}/label?${q}`;
  };
  const pack = activePack();
  const label = buildLabel({
    product: { ...product, recipe: cleanRecipe(product.recipe) },
    business: { name: biz?.name ?? "", cityStateZip: biz?.city_state_zip ?? "", contact: biz?.contact ?? "" },
    size,
    pack,
    batch: batch ? { lot: batch.lot as string, recipe: cleanRecipe(batch.recipe) } : null,
  });
  const frontText = label.front.join("\n");
  const backText = label.back.join("\n");

  return (
    <main className="wrap narrow">
      <BrandMark href="/app" />
      <div>
        <p className="eyebrow">Label</p>
        <h1>{product.name}</h1>
      </div>

      {sizes.length > 1 && (
        <nav className="tabs" aria-label="Sizes">
          {sizes.map((s) => (
            <Link
              key={s.id}
              href={link({ size: s.id })}
              className={`btn sm${s.id === size?.id ? " pri" : ""}`}
              aria-current={s.id === size?.id ? "page" : undefined}
            >
              {s.name}
            </Link>
          ))}
        </nav>
      )}

      {batches.length > 0 && (
        <nav className="tabs" aria-label="Batches">
          <Link href={link({ batch: "standard" })} className={`btn sm${!batch ? " pri" : ""}`}>
            Usual recipe
          </Link>
          {batches.slice(0, 6).map((b) => (
            <Link
              key={b.id}
              href={link({ batch: b.id })}
              className={`btn sm${b.id === batch?.id ? " pri" : ""}`}
              aria-current={b.id === batch?.id ? "page" : undefined}
            >
              <span className="mono">{b.lot}</span>
            </Link>
          ))}
        </nav>
      )}

      {label.blockers.length > 0 && (
        <div className="note" role="status">
          <b>Before you print:</b>
          <ul className="tight">
            {label.blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      )}

      {label.claims.length > 0 && (
        <div className="note">
          <b>Wording to check:</b>
          <ul className="tight">
            {label.claims.map((c) => (
              <li key={c.word}>
                &ldquo;{c.word}&rdquo;: {c.why} {c.fix}
              </li>
            ))}
          </ul>
        </div>
      )}

      <section className="card" aria-labelledby="front">
        <h2 id="front">Front{size ? ` · ${size.name}` : ""}</h2>
        <div className="lbl">
          <div className="nm">{product.name}</div>
          {product.identity && <div>{product.identity}</div>}
          {label.net && <div className="net">{label.net}</div>}
        </div>
        {label.size?.lettering ? (
          <p className="hint">
            Front label {label.size.labelText} ({label.size.areaSqIn!.toFixed(1)} sq in): net weight letters at least{" "}
            <b>{label.size.lettering.minHeight}</b> tall, in the bottom third of the front.
          </p>
        ) : (
          size && <p className="hint">Add this size&rsquo;s label dimensions to see the smallest letter size allowed.</p>
        )}
        {label.approximate && (
          <p className="hint">No size yet, so the net weight is the batch divided by how many it makes, from typical values. Add a size for an exact one.</p>
        )}
      </section>

      <section className="card" aria-labelledby="back">
        <h2 id="back">Back</h2>
        <div className="lbl">
          {label.back.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>
      </section>

      <section className="card">
        <CopyButtons front={frontText} back={backText} />
        <p className="hint">Paste into Canva or your label app. Check every label before you print.</p>
      </section>

      <div className="row">
        <Link href={`/app/products/${id}/batches/new`} className="btn cta">
          Log a batch (optional)
        </Link>
        <Link href={`/app/products/${id}`} className="btn ghost cta">
          Back to {product.name}
        </Link>
      </div>
    </main>
  );
}
