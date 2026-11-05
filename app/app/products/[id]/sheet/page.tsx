import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { pageTitle } from "@/lib/brand";
import { createClient } from "@/lib/supabase/server";
import { BrandMark } from "../../../../BrandMark";

export const metadata: Metadata = { title: pageTitle("Product sheet") };
export const dynamic = "force-dynamic";

/**
 * Product sheet: one product on a page. Buyer = for shops and wholesale (nothing private);
 * internal = with the recipe amounts and batch history. Both as PDFs.
 */
export default async function ProductSheet({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ kind?: string }>;
}) {
  const { id } = await params;
  const kind = (await searchParams).kind === "internal" ? "internal" : "buyer";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data: product } = await supabase.from("products").select("id, name").eq("id", id).maybeSingle();
  if (!product) notFound();
  const pdf = `/app/products/${id}/sheet/pdf?kind=${kind}`;

  return (
    <main className="wrap narrow">
      <BrandMark href="/app" />
      <div>
        <p className="eyebrow">Product sheet</p>
        <h1>{product.name}</h1>
      </div>
      <div className="seg" role="group" aria-label="Which sheet">
        <Link href={`/app/products/${id}/sheet`} aria-current={kind === "buyer" ? "page" : undefined} className={kind === "buyer" ? "on" : ""}>
          For buyers
        </Link>
        <Link href={`/app/products/${id}/sheet?kind=internal`} aria-current={kind === "internal" ? "page" : undefined} className={kind === "internal" ? "on" : ""}>
          Internal
        </Link>
      </div>
      <p className="hint">
        {kind === "buyer"
          ? "For shops, wholesale and markets: name, sizes, ingredients, claims, allergens, warnings and how to reach you. Your recipe amounts stay private."
          : "For your own records: everything on the buyer sheet plus the recipe with amounts and your batch history. Don't send this one out."}
      </p>
      <a href={`${pdf}&download=1`} className="bigbtn bigbtn-pri">
        Download PDF
      </a>
      <iframe className="sheet-preview" src={pdf} title={`${product.name} ${kind === "buyer" ? "buyer" : "internal"} sheet preview`} />
      <Link href={`/app/products/${id}`} className="btn ghost sm cta">
        Back to the product
      </Link>
    </main>
  );
}
