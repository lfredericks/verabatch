import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { pageTitle } from "@/lib/brand";
import { activePack } from "@/lib/packs";
import { effectiveRecipe } from "@/lib/productData";
import type { Product } from "@/lib/products";
import type { Size } from "@/lib/sizes";
import { countsText } from "@/lib/batches";
import { createClient } from "@/lib/supabase/server";
import { BrandMark } from "../../../BrandMark";
import { ProductEditor } from "../ProductEditor";
import { ProductInfo } from "../ProductInfo";
import { SizesEditor } from "../SizesEditor";
import { Descriptions } from "../Descriptions";
import { cleanDescriptions } from "@/lib/channels";
import { logoUrl } from "@/lib/logos";
import { LogoField } from "../../LogoField";
import { Warnings } from "../Warnings";
import { cleanWarnings, warningLines } from "@/lib/warnings";
import { buildLabel } from "@/lib/label";
import { ProductHero } from "../ProductHero";

export const dynamic = "force-dynamic";

async function load(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const { lines, parent } = await effectiveRecipe(supabase, data);
  return { product: { ...(data as Product), recipe: lines } as Product, parent, descriptions: cleanDescriptions(data.descriptions) };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const loaded = await load((await params).id);
  return { title: pageTitle(loaded?.product.name ?? "Product") };
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
  const loaded = await load((await params).id);
  if (!loaded) notFound();
  const { product, parent, descriptions } = loaded;
  const { data: kids } = await supabase.from("products").select("id, name").eq("parent_id", product.id).order("name");
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
  const ownLogo = (product as Product & { logo_path?: string | null }).logo_path ?? null;
  const productLogo = await logoUrl(supabase, ownLogo);
  const pack = activePack();
  const warnings = cleanWarnings((product as Product & { warnings?: unknown }).warnings, pack);
  // Is the label ready? Checked against the first size, the same way the label page does.
  const { data: biz } = await supabase.from("businesses").select("name, city_state_zip, contact").limit(1).maybeSingle();
  const label = buildLabel({
    product: { ...product, warnings },
    business: { name: biz?.name ?? "", cityStateZip: biz?.city_state_zip ?? "", contact: biz?.contact ?? "" },
    size: sizes[0] ?? null,
    pack,
  });
  const printedWarnings = warningLines(warnings, pack);
  let logoNote = "Optional. Without one, the label uses your business logo.";
  if (!ownLogo && parent) {
    const { data: p } = await supabase.from("products").select("logo_path").eq("id", parent.id).maybeSingle();
    if (p?.logo_path) logoNote = `Optional. Without one, the label uses ${parent.name}'s logo.`;
  }

  return (
    <main className="wrap narrow">
      <BrandMark href="/app" />
      {parent && (
        <p className="eyebrow">
          Variation of <Link href={`/app/products/${parent.id}`}>{parent.name}</Link>
        </p>
      )}
      <ProductHero
        productId={product.id}
        name={product.name}
        subtitle={[product.identity, sizes[0]?.name].filter(Boolean).join(" · ")}
        logoUrl={productLogo}
        blockers={label.blockers}
        rows={[
          { href: "#recipe", title: "Recipe", detail: `${product.recipe.length} ingredient${product.recipe.length === 1 ? "" : "s"}${product.makes ? ` · makes ${product.makes}` : ""}` },
          { href: "#sizes", title: "Sizes", detail: sizes.length ? sizes.map((s) => s.name).join(", ") : "None yet" },
          {
            href: "#batches",
            title: "Batches",
            detail: batches?.length
              ? `${batches.length} logged · last made ${new Date(`${batches[0]!.made_on}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
              : "None yet (optional)",
          },
          { href: "#warnings", title: "Warnings", detail: printedWarnings.length ? `${printedWarnings.length === 1 ? "1 statement" : `${printedWarnings.length} statements`} on the back` : "None yet" },
          { href: "#info", title: "Product info and logo", detail: product.identity || "Name, kind, what it is" },
        ]}
      />
      {kids && kids.length > 0 && (
        <p className="hint">
          Variations:{" "}
          {kids.map((k, i) => (
            <span key={k.id}>
              {i > 0 && ", "}
              <Link href={`/app/products/${k.id}`}>{k.name}</Link>
            </span>
          ))}
        </p>
      )}
      <div id="info" className="anchor stack">
      <ProductInfo product={product} />
      <LogoField title="Product logo" url={productLogo} productId={product.id} note={logoNote} />
      </div>
      <div id="recipe" className="anchor stack">
        <ProductEditor product={product} parent={parent} justSaved={saved === "1"} />
      </div>
      <div className="anchor">
        <Warnings productId={product.id} typeKey={product.type_key} warnings={warnings} />
      </div>
      <div className="anchor">
        <SizesEditor productId={product.id} sizes={sizes} defaultUnit={defaultUnit} />
      </div>
      <Descriptions productId={product.id} descriptions={descriptions} />
      <section className="card anchor" aria-labelledby="batches">
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
