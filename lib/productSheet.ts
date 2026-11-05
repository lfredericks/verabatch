import type { SupabaseClient } from "@supabase/supabase-js";
import { cleanDescriptions } from "./channels";
import { computeRecipe, UNIT_LABELS } from "./core";
import { cleanClaims } from "./frontClaims";
import { buildLabel } from "./label";
import { logoBytes } from "./logos";
import { activePack } from "./packs";
import { effectiveRecipe } from "./productData";
import type { Product } from "./products";
import { sizeFacts, type Size } from "./sizes";
import { cleanWarnings } from "./warnings";

/**
 * Product library and product sheets (Leslie, Nov 5). The library is every product as one
 * row of a spreadsheet; a product sheet is one product on a page, in two versions:
 * "buyer" (for shops and wholesale: nothing private) and "internal" (the recipe with
 * amounts and the batch history). Available on every plan.
 */

export interface BatchRow {
  product_id: string;
  lot: string;
  made_on: string;
  changed: boolean;
  counts: Record<string, number> | null;
}

export interface LibraryRow {
  id: string;
  name: string;
  kind: string;
  identity: string;
  variationOf: string;
  sizes: string;
  ingredients: number;
  makes: number | null;
  batches: number;
  lastMade: string;
  label: string;
  claims: string;
}

/** The library: every product, variations after their parent, as spreadsheet rows. */
export async function loadLibrary(supabase: SupabaseClient): Promise<LibraryRow[]> {
  const pack = activePack();
  const [{ data: products }, { data: sizes }, { data: batches }, { data: biz }] = await Promise.all([
    supabase.from("products").select("*").order("name"),
    supabase.from("sizes").select("*").order("position").order("created_at"),
    supabase.from("batches").select("product_id, made_on").order("made_on", { ascending: false }),
    supabase.from("businesses").select("name, city_state_zip, contact").limit(1).maybeSingle(),
  ]);
  const all = (products ?? []) as (Product & { warnings?: unknown; claims?: unknown })[];
  const names = new Map(all.map((p) => [p.id, p.name]));
  const business = { name: biz?.name ?? "", cityStateZip: biz?.city_state_zip ?? "", contact: biz?.contact ?? "" };
  // Parents first, each followed by its variations.
  const ordered = all.filter((p) => !p.parent_id || !names.has(p.parent_id)).flatMap((p) => [p, ...all.filter((k) => k.parent_id === p.id)]);
  const rows: LibraryRow[] = [];
  for (const p of ordered) {
    const { lines } = await effectiveRecipe(supabase, p);
    const mine = ((sizes ?? []) as Size[]).filter((s) => s.product_id === p.id);
    const made = (batches ?? []).filter((b) => b.product_id === p.id);
    const label = buildLabel({
      product: { ...p, recipe: lines, warnings: cleanWarnings(p.warnings, pack), claims: cleanClaims(p.claims, pack) },
      business,
      size: mine[0] ?? null,
      pack,
    });
    rows.push({
      id: p.id,
      name: p.name,
      kind: pack.productTypes.find((t) => t.key === p.type_key)?.label ?? (p.type_key === "other" ? "Something else" : ""),
      identity: p.identity,
      variationOf: p.parent_id ? (names.get(p.parent_id) ?? "") : "",
      sizes: mine.map((s) => s.name).join(", "),
      ingredients: lines.filter((l) => l.text.trim()).length,
      makes: p.makes,
      batches: made.length,
      lastMade: (made[0]?.made_on as string | undefined) ?? "",
      label: label.blockers.length ? `${label.blockers.length} to fix` : "Ready",
      claims: label.claimLine,
    });
  }
  return rows;
}

export const LIBRARY_COLUMNS: { key: keyof LibraryRow; label: string }[] = [
  { key: "name", label: "Product" },
  { key: "kind", label: "Kind" },
  { key: "identity", label: "What it is" },
  { key: "variationOf", label: "Variation of" },
  { key: "sizes", label: "Sizes" },
  { key: "ingredients", label: "Ingredients" },
  { key: "makes", label: "Batch makes" },
  { key: "batches", label: "Batches logged" },
  { key: "lastMade", label: "Last made" },
  { key: "label", label: "Label" },
  { key: "claims", label: "Claims" },
];

/** The library as CSV, with a byte-order mark so Excel reads accents and symbols right. */
export function libraryCsv(rows: LibraryRow[]): string {
  const cell = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    // Quote everything; a leading = + - @ could run as a formula in a spreadsheet.
    const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const head = LIBRARY_COLUMNS.map((c) => cell(c.label)).join(",");
  const body = rows.map((r) => LIBRARY_COLUMNS.map((c) => cell(r[c.key])).join(","));
  return "﻿" + [head, ...body].join("\r\n") + "\r\n";
}

export type SheetKind = "buyer" | "internal";

export interface SheetData {
  kind: SheetKind;
  business: { name: string; place: string; contact: string };
  name: string;
  identity: string;
  claims: string;
  about: string;
  sizes: { name: string; net: string }[];
  ingredients: string;
  allergens: string;
  warnings: string[];
  certifier: string;
  logo: { bytes: Uint8Array; kind: "png" | "jpg" } | null;
  /** Internal only. */
  recipe: { amount: string; ingredient: string; labelName: string; pct: string; organic: boolean }[];
  makes: number | null;
  batchWeight: string;
  batches: { lot: string; madeOn: string; counts: string; changed: boolean }[];
  variationOf: string;
  prepared: string;
}

function weight(g: number): string {
  if (g <= 0) return "";
  return `about ${(g / 28.3495).toFixed(g < 28 ? 2 : 1)} oz (${g < 10 ? g.toFixed(1) : Math.round(g)} g)`;
}

/** Everything one product sheet shows. Null if the product isn't there or isn't this person's. */
export async function loadSheet(supabase: SupabaseClient, id: string, kind: SheetKind): Promise<SheetData | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const pack = activePack();
  const { data: p } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (!p) return null;
  const [{ lines, parent }, { data: sizeRows }, { data: biz }, { data: batchRows }] = await Promise.all([
    effectiveRecipe(supabase, p),
    supabase.from("sizes").select("*").eq("product_id", id).order("position").order("created_at"),
    supabase.from("businesses").select("name, city_state_zip, contact, logo_path").limit(1).maybeSingle(),
    supabase.from("batches").select("lot, made_on, changed, counts").eq("product_id", id).order("made_on", { ascending: false }).limit(60),
  ]);
  const sizes = (sizeRows ?? []) as Size[];
  const business = { name: biz?.name ?? "", cityStateZip: biz?.city_state_zip ?? "", contact: biz?.contact ?? "" };
  const claims = cleanClaims(p.claims, pack);
  const label = buildLabel({ product: { ...p, recipe: lines, warnings: cleanWarnings(p.warnings, pack), claims }, business, size: null, pack });
  const descriptions = cleanDescriptions(p.descriptions);

  // Logo: the product's, else its parent's, else the business's.
  let logoPath: string | null = p.logo_path ?? null;
  if (!logoPath && p.parent_id) {
    const { data: par } = await supabase.from("products").select("logo_path").eq("id", p.parent_id).maybeSingle();
    logoPath = par?.logo_path ?? null;
  }
  logoPath = logoPath ?? biz?.logo_path ?? null;

  const computed = computeRecipe(lines, pack);
  const sizeNames = Object.fromEntries(sizes.map((s) => [s.id, s.name]));
  return {
    kind,
    business: { name: business.name, place: business.cityStateZip, contact: business.contact },
    name: p.name,
    identity: p.identity ?? "",
    claims: label.claimLine,
    about: (descriptions.website ?? descriptions.other ?? descriptions.etsy ?? "").slice(0, 1400),
    sizes: sizes.map((s) => ({ name: s.name, net: sizeFacts(s, pack.lettering).net ?? "" })),
    ingredients: label.ingredients,
    allergens: label.claimCheck.allergens.line,
    warnings: label.warnings,
    certifier: label.claimCheck.back[0] ?? "",
    logo: await logoBytes(supabase, logoPath),
    recipe: computed.lines.map((l) => {
      const r = l.resolution;
      const names = r.status === "known" ? (r.parts ? r.parts.map((x) => x.labelName) : [r.labelName]) : [];
      return {
        amount: l.line.amount ? `${l.line.amount} ${UNIT_LABELS[l.line.unit]}` : "",
        ingredient: l.line.text,
        labelName: names.join(", ") || (r.status === "needsChoice" ? "Needs an answer" : "Not in the list"),
        pct: l.pct > 0 ? `${l.pct < 1 ? l.pct.toFixed(2) : l.pct.toFixed(1)}%` : "",
        organic: Boolean(l.line.organic),
      };
    }),
    makes: p.makes ?? null,
    batchWeight: weight(computed.totalGrams) + (computed.anyApproximate && computed.totalGrams > 0 ? " (cups, spoons and drops estimated)" : ""),
    batches: (batchRows ?? []).map((b) => ({
      lot: b.lot as string,
      madeOn: b.made_on as string,
      counts: Object.entries((b.counts as Record<string, number> | null) ?? {})
        .filter(([, n]) => n > 0)
        .map(([sid, n]) => `${n} × ${sizeNames[sid] ?? "size"}`)
        .join(", "),
      changed: Boolean(b.changed),
    })),
    variationOf: parent?.name ?? "",
    prepared: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
  };
}

/** "Shop_Product_buyer-sheet.pdf" (same naming as label files: sections by _, words by -). */
export function sheetFileName(d: SheetData): string {
  const part = (s: string) => s.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "x";
  return [part(d.business.name || "Shop"), part(d.name), d.kind === "buyer" ? "Buyer-sheet" : "Internal-sheet"].join("_") + ".pdf";
}
