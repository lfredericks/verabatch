import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { pageTitle } from "@/lib/brand";
import { activePack } from "@/lib/packs";
import { cleanRecipe, type Product } from "@/lib/products";
import type { Size } from "@/lib/sizes";
import { countsText } from "@/lib/batches";
import { createClient } from "@/lib/supabase/server";
import { BrandMark } from "../../../BrandMark";
import { ProductEditor } from "../ProductEditor";
import { SizesEditor } from "../SizesEditor";

export const dynamic = "force-dynamic";

async function load(id: string): Promise<Product | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("id, name, type_key, identity, makes, recipe, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  return { ...(data as Product), recipe: cleanRecipe(data.recipe) };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const product = await load((await params).id);
  return { title: pageTitle(product?.name ?? "Product") };
}

export default async function EditProduct({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const product = await load((await params).id);
  if (!product) notFound();
  const { saved } = await searchParams;
  const { data: sizeRows } = await supabase
    .from("sizes")
    .select("*")
    .eq("product_id", product.id)
    .order("position")
    .order("created_at");
  const sizes = (sizeRows ?? []) as Size[];
  const { data: batches } = await supabase
    .from("batches")
    .select("id, lot, made_on, changed, counts")
    .eq("product_id", product.id)
    .order("made_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);
  const sizeNames = Object.fromEntries(sizes.map((s) => [s.id, s.name]));
  const type = activePack().productTypes.find((t) => t.key === product.type_key);
  const defaultUnit = type?.declareBy === "volume" ? "floz" : "oz";

  return (
    <main className="wrap narrow">
      <BrandMark href="/app" />
      <h1>{product.name}</h1>
      <ProductEditor product={product} justSaved={saved === "1"} />
      <SizesEditor productId={product.id} sizes={sizes} defaultUnit={defaultUnit} />
      <Link href={`/app/products/${product.id}/label`} className="btn pri cta">
        See the label
      </Link>
      <section className="card" aria-labelledby="batches">
        <h2 id="batches">Batches (optional)</h2>
        {batches && batches.length > 0 ? (
          <ul className="plist">
            {batches.map((b) => (
              <li key={b.id}>
                <div className="sizerow">
                  <div>
                    <b className="mono">{b.lot}</b>
                    <span>
                      {new Date(`${b.made_on}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      {" · "}
                      {countsText(b.counts as Record<string, number>, sizeNames)}
                      {b.changed && " · changed"}
                    </span>
                  </div>
                  <div className="row">
                    <Link href={`/app/products/${product.id}/label?batch=${b.id}`} className="btn sm cta">
                      Label
                    </Link>
                    <Link href={`/app/products/${product.id}/batches/${b.id}`} className="btn ghost sm cta">
                      Edit
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="hint">
            Optional. One label for every run works fine. If you want a lot number on each run&rsquo;s label, log the batch here.
          </p>
        )}
        <Link href={`/app/products/${product.id}/batches/new`} className="btn pri cta">
          I made a batch
        </Link>
      </section>
      <Link href={`/app/products/${product.id}/manage`} className="btn ghost sm cta">
        Manage product (delete)
      </Link>
    </main>
  );
}
