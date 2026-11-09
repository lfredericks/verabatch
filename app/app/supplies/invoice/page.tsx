import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { pageTitle } from "@/lib/brand";
import { loadMaterials } from "@/lib/materialsServer";
import { createClient } from "@/lib/supabase/server";
import { BrandMark } from "../../../BrandMark";
import { InvoiceForm } from "./InvoiceForm";

export const metadata: Metadata = { title: pageTitle("Add from an invoice") };
export const dynamic = "force-dynamic";

/**
 * Add from an invoice. Typing it in works on every plan. Photos and PDFs (read for you) are
 * Pro and come later, so they show as "Coming soon" rather than a dead button.
 */
export default async function InvoicePage({ searchParams }: { searchParams: Promise<{ how?: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { how } = await searchParams;
  const { materials, deliveries } = await loadMaterials(supabase);
  const shops = [...new Set([...deliveries].reverse().map((d) => d.supplier).filter(Boolean))];

  return (
    <main className="wrap narrow">
      <BrandMark href="/app" />
      <div>
        <p className="eyebrow">
          <Link href="/app/supplies">My supplies</Link>
        </p>
        <h1>{how === "type" ? "Type in your invoice" : "Add from an invoice"}</h1>
        {how !== "type" && <p className="hint">Everything on it goes into your supplies in one go.</p>}
      </div>
      {how === "type" ? (
        <InvoiceForm materials={materials.map((m) => m.name)} shops={shops} />
      ) : (
        <div className="stack">
          <Link href="/app/supplies/invoice?how=type" className="tile">
            <b>Type it in</b>
            <span className="hint">Shop, date, then each line.</span>
          </Link>
          <div className="tile" aria-disabled="true">
            <b>Take photos</b>
            <span className="hint">We read it for you. Coming soon.</span>
          </div>
          <div className="tile" aria-disabled="true">
            <b>Upload a PDF</b>
            <span className="hint">We read it for you. Coming soon.</span>
          </div>
        </div>
      )}
    </main>
  );
}
