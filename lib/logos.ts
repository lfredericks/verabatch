import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Logos: one per business, and an optional one per product. Stored in the private
 * "logos" bucket under the business's folder (migration 0007). PNG or JPG only, since
 * those go straight into the label PDF; PNG keeps a see-through background.
 */

export const LOGO_BUCKET = "logos";
/** Stays under Vercel's 4.5 MB upload limit. */
export const MAX_LOGO_BYTES = 4 * 1024 * 1024;

export type LogoKind = "png" | "jpg";

/** What the file really is, from its first bytes (not its name). */
export function logoKind(bytes: Uint8Array): LogoKind | null {
  if (bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  return null;
}

/** Check an uploaded file. Returns its bytes and kind, or a plain-words problem. */
export async function readLogoFile(file: unknown): Promise<{ bytes: Uint8Array; kind: LogoKind } | { error: string }> {
  if (!(file instanceof Blob) || file.size === 0) return { error: "Choose a logo file first." };
  if (file.size > MAX_LOGO_BYTES) return { error: "That file is over 4 MB. Save a smaller copy and try again." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = logoKind(bytes);
  if (!kind) return { error: "Use a PNG or JPG file. PNG keeps a see-through background." };
  return { bytes, kind };
}

function randomPart(): string {
  return crypto.randomUUID().slice(0, 8);
}

/** Where a new logo file goes. A new name each time, so old copies are never cached. */
export function logoPath(businessId: string, kind: LogoKind, productId?: string): string {
  const who = productId ? `product-${productId}` : "business";
  return `${businessId}/${who}-${randomPart()}.${kind}`;
}

/** A short-lived link for showing a logo on a page. */
export async function logoUrl(supabase: SupabaseClient, path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from(LOGO_BUCKET).createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

/** The logo file itself, for the label PDF. */
export async function logoBytes(
  supabase: SupabaseClient,
  path: string | null | undefined,
): Promise<{ bytes: Uint8Array; kind: LogoKind } | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from(LOGO_BUCKET).download(path);
  if (!data) return null;
  const bytes = new Uint8Array(await data.arrayBuffer());
  const kind = logoKind(bytes);
  return kind ? { bytes, kind } : null;
}
