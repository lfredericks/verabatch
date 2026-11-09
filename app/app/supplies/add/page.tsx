import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { pageTitle } from "@/lib/brand";
import { amountShort } from "@/lib/materials";
import { loadMaterials } from "@/lib/materialsServer";
import { createClient } from "@/lib/supabase/server";
import { AddFlow } from "./AddFlow";

export const metadata: Metadata = { title: pageTitle("Add a supply") };
export const dynamic = "force-dynamic";

export default async function AddSupplyPage({ searchParams }: { searchParams: Promise<{ material?: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { material } = await searchParams;
  const { materials, deliveries } = await loadMaterials(supabase);
  const options = materials.map((m) => ({ id: m.id, name: m.name, onHand: m.onHand?.unit ? amountShort(m.onHand.amount, m.onHand.unit) : "" }));
  // Shops used most recently first.
  const shops = [...new Set([...deliveries].reverse().map((d) => d.supplier).filter(Boolean))];
  const start = options.find((o) => o.id === material) ?? null;
  return (
    <main className="wrap narrow">
      <AddFlow materials={options} shops={shops} start={start} />
    </main>
  );
}
