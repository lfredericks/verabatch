import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { pageTitle } from "@/lib/brand";
import { activePack } from "@/lib/packs";
import { createClient } from "@/lib/supabase/server";
import { ContainerStep } from "../../ContainerStep";

export const metadata: Metadata = { title: pageTitle("What does it go in?") };
export const dynamic = "force-dynamic";

/** Last question after adding a product (first run included): the container, then the label. */
export default async function ContainerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: product } = await supabase.from("products").select("id, name, type_key").eq("id", id).maybeSingle();
  if (!product) notFound();
  const { count } = await supabase.from("sizes").select("id", { count: "exact", head: true }).eq("product_id", id);
  if (count) redirect(`/app/products/${id}/label`);
  const type = activePack().productTypes.find((t) => t.key === product.type_key);

  return (
    <main className="wrap narrow">
      <div className="ob-top">
        <Link href={`/app/products/${id}`} className="ob-icon" aria-label="Close">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </Link>
        <div className="ob-bar" aria-hidden="true">
          <div style={{ width: "92%" }} />
        </div>
        <span className="ob-count">Last one</span>
      </div>
      <p className="eyebrow">{product.name}</p>
      <ContainerStep productId={id} defaultUnit={type?.declareBy === "volume" ? "floz" : "oz"} typeKey={product.type_key ?? null} />
      <Link href={`/app/products/${id}`} className="cta hint">
        Skip for now
      </Link>
    </main>
  );
}
