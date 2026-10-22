import { NextResponse, type NextRequest } from "next/server";
import { buildLabel } from "@/lib/label";
import { buildLabelPdf, labelFileName, type LabelPdf } from "@/lib/labelPdf";
import { logoBytes } from "@/lib/logos";
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
/** Which logos go on the label. */
export interface LogoChoice {
  product: boolean;
  business: boolean;
}

/**
 * Logo checkboxes from the link. With no choice made, the product's logo wins and the
 * business logo is the fallback.
 */
export function readLogoChoice(q: URLSearchParams): LogoChoice | null {
  if (!q.get("ls")) return null;
  const picked = q.getAll("logo");
  return { product: picked.includes("product"), business: picked.includes("business") };
}

export async function loadLabel(id: string, sizeId?: string, batchParam?: string, choice?: LogoChoice | null) {
  if (!UUID.test(id)) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { signedOut: true as const };

  const [{ data: product }, { data: sizeRows }, { data: biz }, { data: batchRows }] = await Promise.all([
    supabase.from("products").select("id, name, type_key, identity, makes, recipe, parent_id, changes, logo_path").eq("id", id).maybeSingle(),
    supabase.from("sizes").select("*").eq("product_id", id).order("position").order("created_at"),
    supabase.from("businesses").select("name, city_state_zip, contact, logo_path").limit(1).maybeSingle(),
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
  // The product's own logo, else its parent's (for a variation).
  let productLogo: string | null = product.logo_path ?? null;
  if (!productLogo && product.parent_id) {
    const { data: p } = await supabase.from("products").select("logo_path").eq("id", product.parent_id).maybeSingle();
    productLogo = p?.logo_path ?? null;
  }
  const businessLogo: string | null = biz?.logo_path ?? null;
  const logos: LogoChoice = choice ?? { product: Boolean(productLogo), business: !productLogo && Boolean(businessLogo) };
  // Front: the product logo if it's ticked, else the business logo. Both ticked: business logo goes on the back.
  const frontLogo = logos.product && productLogo ? productLogo : logos.business && !(logos.product && productLogo) ? businessLogo : null;
  const backLogo = logos.product && productLogo && logos.business ? businessLogo : null;
  const fileName = size
    ? labelFileName({ business: biz?.name ?? "", product: product.name, size: size.name, lot: batch?.lot as string | undefined })
    : null;
  return { signedOut: false as const, supabase, product, sizes, size, batches, batch, label, fileName, logos, has: { product: Boolean(productLogo), business: Boolean(businessLogo) }, frontLogo, backLogo };
}

type Loaded = Extract<NonNullable<Awaited<ReturnType<typeof loadLabel>>>, { signedOut: false }>;

/** The label PDF, or why it can't be made yet (no label dimensions on this size). */
export async function labelPdfFor(loaded: Loaded): Promise<{ pdf: LabelPdf } | { missing: string }> {
  const { product, size, label, fileName, supabase, frontLogo, backLogo } = loaded;
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
      title: (fileName ?? "Label.pdf").replace(/\.pdf$/, ""),
      logo: await logoBytes(supabase, frontLogo),
      backLogo: await logoBytes(supabase, backLogo),
    },
    await loadLabelFonts(),
  );
  return { pdf };
}

/** The label PDF as a download. Its link ends in the file name, so browsers save it under that name. */
export async function labelPdfResponse(req: NextRequest, id: string) {
  const q = req.nextUrl.searchParams;
  const loaded = await loadLabel(id, q.get("size") ?? undefined, q.get("batch") ?? undefined, readLogoChoice(q));
  if (!loaded) return new NextResponse("Not found", { status: 404 });
  if (loaded.signedOut) return NextResponse.redirect(new URL("/login", req.url));
  const made = await labelPdfFor(loaded);
  if ("missing" in made) return new NextResponse(made.missing, { status: 400 });
  const name = loaded.fileName ?? "Label.pdf";
  const ascii = name.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");
  return new NextResponse(Buffer.from(made.pdf.bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${q.get("download") ? "attachment" : "inline"}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`,
      "Cache-Control": "private, no-store",
    },
  });
}
