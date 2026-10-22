"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cleanReading, invoiceReaderReady, readInvoiceFile, type InvoiceReading } from "@/lib/invoiceReader";
import { activePack } from "@/lib/packs";
import { parseMoney, readSupplyForm } from "@/lib/supplies";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f-]{36}$/i;
const MAX_BYTES = 4 * 1024 * 1024;

export interface InvoiceUploadState {
  error?: string;
  invoiceId?: string;
  reading?: InvoiceReading;
  /** Set when the file was saved but couldn't be read automatically. */
  readError?: string;
  readerReady?: boolean;
}

function fileType(b: Uint8Array): "image/jpeg" | "image/png" | "application/pdf" | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return "application/pdf";
  return null;
}

/** Save the invoice photo or PDF, then read it if the reader is set up. */
export async function uploadInvoice(_prev: InvoiceUploadState, form: FormData): Promise<InvoiceUploadState> {
  const file = form.get("file");
  if (!(file instanceof Blob) || file.size === 0) return { error: "Choose a photo or PDF of the invoice first." };
  if (file.size > MAX_BYTES) return { error: "That file is over 4 MB. Take the photo again, or save a smaller PDF." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = fileType(bytes);
  if (!type) return { error: "Use a photo (JPG or PNG) or a PDF." };

  const supabase = await createClient();
  const { data: member } = await supabase.from("business_members").select("business_id").limit(1).maybeSingle();
  if (!member) return { error: "Add your business details first." };
  const ext = type === "application/pdf" ? "pdf" : type === "image/png" ? "png" : "jpg";
  const path = `${member.business_id}/invoice-${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await supabase.storage.from("invoices").upload(path, bytes, { contentType: type, upsert: false });
  if (upErr) return { error: "We couldn't upload that. Try again in a moment." };
  const { data: inv, error } = await supabase
    .from("invoices")
    .insert({ business_id: member.business_id, file_path: path, file_type: type })
    .select("id")
    .single();
  if (error || !inv) {
    await supabase.storage.from("invoices").remove([path]);
    return { error: "We couldn't save that. Try again in a moment." };
  }

  const ready = invoiceReaderReady();
  const empty = cleanReading({});
  if (!ready) return { invoiceId: inv.id as string, reading: empty, readerReady: false };
  try {
    const reading = await readInvoiceFile(bytes, type);
    return { invoiceId: inv.id as string, reading, readerReady: true };
  } catch (e) {
    return { invoiceId: inv.id as string, reading: empty, readerReady: true, readError: e instanceof Error ? e.message : "We couldn't read that invoice." };
  }
}

export interface InvoiceSaveState {
  error?: string;
}

/** Save the reviewed lines as supplies, all linked to this invoice. */
export async function saveInvoiceItems(_prev: InvoiceSaveState, form: FormData): Promise<InvoiceSaveState> {
  const invoiceId = String(form.get("invoice_id") ?? "");
  if (!UUID.test(invoiceId)) return { error: "Something went wrong. Start again with the invoice." };
  const supplier = String(form.get("supplier") ?? "").trim().slice(0, 120);
  const invoiceNumber = String(form.get("invoice_number") ?? "").trim().slice(0, 60);
  const invoiceDate = String(form.get("invoice_date") ?? "").trim();
  const total = parseMoney(String(form.get("total") ?? ""));
  if (total !== null && Number.isNaN(total)) return { error: "Enter the invoice total in dollars, like 84.20, or leave it empty." };
  let items: unknown[] = [];
  try {
    const parsed = JSON.parse(String(form.get("items") ?? "[]"));
    items = Array.isArray(parsed) ? parsed.slice(0, 60) : [];
  } catch {
    items = [];
  }
  if (!items.length) return { error: "Add at least one item." };

  const pack = activePack();
  const rows = [];
  for (const [n, raw] of items.entries()) {
    const it = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    const f = new FormData();
    for (const k of ["ingredient", "amount", "unit", "supplier_lot", "cost", "description", "note"]) f.set(k, String(it[k] ?? ""));
    f.set("name_pick", JSON.stringify(it.name_pick ?? null));
    f.set("supplier", supplier);
    f.set("received_on", invoiceDate);
    const r = readSupplyForm(f, pack);
    if ("error" in r) return { error: `Line ${n + 1}: ${r.error}` };
    rows.push(r.row);
  }

  const supabase = await createClient();
  const { data: inv } = await supabase.from("invoices").select("id, business_id").eq("id", invoiceId).maybeSingle();
  if (!inv) return { error: "That invoice is gone. Start again." };
  const { error: hdrErr } = await supabase
    .from("invoices")
    .update({ supplier, invoice_number: invoiceNumber, invoice_date: /^\d{4}-\d{2}-\d{2}$/.test(invoiceDate) ? invoiceDate : null, total })
    .eq("id", invoiceId);
  if (hdrErr) return { error: "We couldn't save that. Try again in a moment." };
  const { error } = await supabase.from("supplies").insert(rows.map((r) => ({ ...r, business_id: inv.business_id, invoice_id: invoiceId })));
  if (error) return { error: "We couldn't save those supplies. Try again in a moment." };
  revalidatePath("/app/supplies");
  redirect(`/app/supplies?added=${rows.length}`);
}
