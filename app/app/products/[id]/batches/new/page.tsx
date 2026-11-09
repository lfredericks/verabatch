import type { Metadata } from "next";
import { pageTitle } from "@/lib/brand";
import { BrandMark } from "../../../../../BrandMark";
import { BatchForm } from "../../../BatchForm";
import { loadForBatch } from "../load";
import { PlanNote } from "../../../../PlanNote";
import { atBatchLimit, BATCH_LIMIT_TEXT, planInfo } from "@/lib/planServer";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: pageTitle("I made a batch") };
export const dynamic = "force-dynamic";

export default async function NewBatch({ params }: { params: Promise<{ id: string }> }) {
  const { product, sizes, supplies, picks, links } = await loadForBatch((await params).id);
  const limited = atBatchLimit(await planInfo(await createClient()));
  return (
    <main className="wrap narrow">
      <BrandMark href="/app" />
      <div>
        <p className="eyebrow">{product.name} · today</p>
        <h1>What went in</h1>
        {!limited && product.recipe.length > 0 && <p className="hint">We picked your oldest of each. Tap a line to change it.</p>}
      </div>
      {limited ? (
        <PlanNote title="Batches on Free" text={BATCH_LIMIT_TEXT} back={`/app/products/${product.id}`} />
      ) : (
      <BatchForm productId={product.id} productName={product.name} master={product.recipe} makes={product.makes} sizes={sizes} batch={null} supplies={supplies} picks={picks} links={links} />
      )}
    </main>
  );
}
