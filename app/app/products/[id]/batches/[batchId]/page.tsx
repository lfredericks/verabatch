import type { Metadata } from "next";
import { pageTitle } from "@/lib/brand";
import { BrandMark } from "../../../../../BrandMark";
import { BatchForm } from "../../../BatchForm";
import { loadForBatch } from "../load";

export const metadata: Metadata = { title: pageTitle("Batch") };
export const dynamic = "force-dynamic";

export default async function EditBatch({ params }: { params: Promise<{ id: string; batchId: string }> }) {
  const { id, batchId } = await params;
  const { product, sizes, batch, supplies, picks } = await loadForBatch(id, batchId);
  return (
    <main className="wrap narrow">
      <BrandMark href="/app" />
      <div>
        <p className="eyebrow">Batch {batch!.lot}</p>
        <h1>{product.name}</h1>
      </div>
      <BatchForm productId={product.id} productName={product.name} master={product.recipe} makes={product.makes} sizes={sizes} batch={batch} supplies={supplies} picks={picks} />
    </main>
  );
}
