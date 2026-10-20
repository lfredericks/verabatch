import { notFound, redirect } from "next/navigation";
import type { Batch } from "@/lib/batches";
import { effectiveRecipe } from "@/lib/productData";
import { cleanRecipe } from "@/lib/products";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f-]{36}$/i;

/** Product, its sizes, and optionally one batch, for the batch pages. */
export async function loadForBatch(productId: string, batchId?: string) {
  if (!UUID.test(productId) || (batchId !== undefined && !UUID.test(batchId))) notFound();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: product }, { data: sizes }, batchRes] = await Promise.all([
    supabase.from("products").select("id, name, makes, recipe, parent_id, changes").eq("id", productId).maybeSingle(),
    supabase.from("sizes").select("id, name").eq("product_id", productId).order("position").order("created_at"),
    batchId
      ? supabase.from("batches").select("*").eq("id", batchId).eq("product_id", productId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  if (!product || (batchId && !batchRes.data)) notFound();
  const { lines } = await effectiveRecipe(supabase, product);
  const batch = batchRes.data ? ({ ...batchRes.data, recipe: cleanRecipe(batchRes.data.recipe) } as Batch) : null;
  return {
    product: { ...product, recipe: lines } as { id: string; name: string; makes: number | null; recipe: ReturnType<typeof cleanRecipe> },
    sizes: (sizes ?? []) as { id: string; name: string }[],
    batch,
  };
}
