import type { Metadata } from "next";
import { pageTitle } from "@/lib/brand";
import { BrandMark } from "../../../../../BrandMark";
import { BatchForm } from "../../../BatchForm";
import { loadForBatch } from "../load";

export const metadata: Metadata = { title: pageTitle("I made a batch") };
export const dynamic = "force-dynamic";

export default async function NewBatch({ params }: { params: Promise<{ id: string }> }) {
  const { product, sizes } = await loadForBatch((await params).id);
  return (
    <main className="wrap narrow">
      <BrandMark href="/app" />
      <div>
        <p className="eyebrow">I made a batch</p>
        <h1>{product.name}</h1>
      </div>
      <BatchForm productId={product.id} productName={product.name} master={product.recipe} makes={product.makes} sizes={sizes} batch={null} />
    </main>
  );
}
