import { buildLabel } from "@/lib/label";
import { buildLabelPdf, type LabelPdf } from "@/lib/labelPdf";
import { loadLabelFonts } from "@/lib/labelFonts/load";
import { activePack } from "@/lib/packs";
import { effectiveRecipe } from "@/lib/productData";
import { cleanRecipe } from "@/lib/products";
import { labelShapeOf, type Size } from "@/lib/sizes";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f-]{36}$/i;

/**
 * Everything the label page and the label PDF need, for one product, size and (optional) batch.
 * Returns null if the product isn't there or isn't this person's.
 */
export async function loadLabel(id: string, sizeId?: string, batchParam?: string) {
  if (!UUID.test(id)) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { signedOut: true as const };

  const [{ data: product }, { data: sizeRows }, { data: biz }, { data: batchRows }] = await Promise.all([
    supabase.from("products").select("id, name, type_key, identity, makes, recipe, parent_id, changes").eq("id", id).maybeSingle(),
    supabase.from("sizes").select("*").eq("product_id", id).order("position").order("created_at"),
    supabase.from("businesses").select("name, city_state_zip, contact").limit(1).maybeSingle(),
    supabase
      .from("batches")
      .select("id, lot, made_on, recipe")
      .eq("product_id", id)
      .order("made_on", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  if (!product) return null;

  const { lines: recipeLines } = await effectiveRecipe(supabase, product);
  const sizes = (sizeRows ?? []) as Size[];
  const size = sizes.find((s) => s.id === sizeId) ?? sizes[0] ?? null;
  const batches = batchRows ?? [];
  // Batches are optional: the label is the usual recipe with no lot unless a batch is picked.
  const batch = batches.find((b) => b.id === batchParam) ?? null;
  const label = buildLabel({
    product: { ...product, recipe: recipeLines },
    business: { name: biz?.name ?? "", cityStateZip: biz?.city_state_zip ?? "", contact: biz?.contact ?? "" },
    size,
    pack: activePack(),
    batch: batch ? { lot: batch.lot as string, recipe: cleanRecipe(batch.recipe) } : null,
  });
  return { signedOut: false as const, product, sizes, size, batches, batch, label };
}

type Loaded = Extract<NonNullable<Awaited<ReturnType<typeof loadLabel>>>, { signedOut: false }>;

/** The label PDF, or why it can't be made yet (no label dimensions on this size). */
export async function labelPdfFor(loaded: Loaded): Promise<{ pdf: LabelPdf } | { missing: string }> {
  const { product, size, label, batch } = loaded;
  if (!size) return { missing: "Add a size with label dimensions to get a print-ready PDF." };
  const shape = labelShapeOf(size);
  if (!shape) return { missing: `Add the label dimensions for ${size.name} to get a print-ready PDF.` };
  const pdf = await buildLabelPdf(
    {
      shape,
      name: product.name,
      identity: product.identity ?? "",
      net: label.net,
      netMinIn: label.size?.lettering?.minHeightIn ?? 1 / 16,
      back: label.back,
      title: `${product.name} · ${size.name}${batch ? ` · Lot ${batch.lot}` : ""}`,
    },
    await loadLabelFonts(),
  );
  return { pdf };
}

/** "garden-balm-2-oz-jar-lot-2026-014.pdf" */
export function pdfFileName(productName: string, sizeName: string, lot?: string | null): string {
  const slug = [productName, sizeName, lot ? `lot ${lot}` : ""]
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${slug || "label"}.pdf`;
}
