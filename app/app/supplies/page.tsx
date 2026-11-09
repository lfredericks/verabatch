import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { pageTitle } from "@/lib/brand";
import { amountShort } from "@/lib/materials";
import { loadMaterials, type MaterialView } from "@/lib/materialsServer";
import { createClient } from "@/lib/supabase/server";
import { BrandMark } from "../../BrandMark";
import { TabBar } from "../TabBar";

export const metadata: Metadata = { title: pageTitle("My supplies") };
export const dynamic = "force-dynamic";

/** Low when every open delivery is down to a quarter or less of what came in. */
function isLow(m: MaterialView): boolean {
  const open = m.deliveries.filter((d) => !d.used_up);
  if (!open.length) return false;
  return open.every((d) => {
    const got = Number(String(d.amount).replace(/[^\d.]/g, ""));
    return d.left !== null && got > 0 && d.left <= got * 0.25;
  });
}

function detail(m: MaterialView): string {
  const open = m.deliveries.filter((d) => !d.used_up).length;
  if (m.blend) return `A blend · ${open === 1 ? "1 delivery" : `${open} deliveries`}`;
  const shops = m.shops.length;
  return [open === 1 ? "1 delivery" : `${open} deliveries`, shops > 1 ? `${shops} shops` : m.shops[0]].filter(Boolean).join(" · ");
}

/** Supplies tab: what's on hand, add a supply, add an invoice, look up a supplier's lot number. */
export default async function SuppliesTab({ searchParams }: { searchParams: Promise<{ all?: string; invoice?: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { all, invoice } = await searchParams;
  const { materials } = await loadMaterials(supabase);
  const inUse = materials.filter((m) => m.deliveries.some((d) => !d.used_up));
  const usedUp = materials.filter((m) => m.deliveries.length && !m.deliveries.some((d) => !d.used_up));
  const shown = all ? [...inUse, ...usedUp] : inUse;

  return (
    <main className="wrap narrow has-tabs">
      <BrandMark href="/app" />
      <div className="tabhead">
        <h1>My supplies</h1>
        <p className="hint">What you have on hand. Tap one to see each delivery.</p>
      </div>
      {invoice && (
        <p className="ok" role="status">
          Invoice saved: {invoice === "1" ? "1 delivery" : `${invoice} deliveries`} added.
        </p>
      )}

      {shown.length > 0 ? (
        <ul className="rows">
          {shown.map((m) => (
            <li key={m.id}>
              <Link href={`/app/supplies/m/${m.id}`}>
                <span className="row-main">
                  <b>{m.name}</b>
                  {isLow(m) ? <span className="st-warn">Getting low</span> : <span>{detail(m) || "No deliveries yet"}</span>}
                </span>
                {m.onHand && m.onHand.unit && <span className="row-end">{amountShort(m.onHand.amount, m.onHand.unit)}</span>}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>Nothing here yet. Add what you buy (shea, jars of oil, bags of herbs) and the app keeps track of what&rsquo;s left as you make batches. It&rsquo;s optional.</p>
      )}
      {!all && usedUp.length > 0 && (
        <Link href="/app/supplies?all=1" className="cta">
          Show used-up supplies ({usedUp.length})
        </Link>
      )}

      <Link href="/app/supplies/lookup" className="searchrow">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        Look up a supplier&rsquo;s lot number
      </Link>

      <div className="bottom-cta">
        <Link href="/app/supplies/invoice" className="btn">
          Add from an invoice
        </Link>
        <Link href="/app/supplies/add" className="btn pri big">
          Add a supply
        </Link>
      </div>
      <TabBar active="supplies" />
    </main>
  );
}
