import type { SupplyUnit } from "./supplies";
import { SUPPLY_UNITS, parseMoney } from "./supplies";

/**
 * Reads a supplier invoice (photo or PDF) into line items with Claude, through the
 * Anthropic API. Needs ANTHROPIC_API_KEY in the server's environment (Vercel settings,
 * never the repo). The maker always reviews the result before anything is saved.
 */

export const INVOICE_MODEL = "claude-sonnet-5-5";

export interface InvoiceItem {
  ingredient: string;
  amount: string;
  unit: SupplyUnit;
  supplier_lot: string;
  cost: number | null;
}

export interface InvoiceReading {
  supplier: string;
  invoice_number: string;
  invoice_date: string | null;
  total: number | null;
  items: InvoiceItem[];
}

export function invoiceReaderReady(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const TOOL = {
  name: "record_invoice",
  description: "Record what this supplier invoice or packing slip says.",
  input_schema: {
    type: "object",
    properties: {
      supplier: { type: "string", description: "The company that sold the goods. Empty if not shown." },
      invoice_number: { type: "string", description: "Invoice or order number. Empty if not shown." },
      invoice_date: { type: "string", description: "Invoice or order date as YYYY-MM-DD. Empty if not shown." },
      total: { type: "number", description: "Grand total in dollars, if shown." },
      items: {
        type: "array",
        description: "One entry per product line. Skip shipping, tax, discounts and fees.",
        items: {
          type: "object",
          properties: {
            ingredient: { type: "string", description: "The product name as printed, cleaned up (e.g. 'Chamomile Flowers, Whole, Organic')." },
            amount: { type: "string", description: "Total quantity received for this line, as a number, e.g. '2'. Multiply packs out (2 x 1 lb = '2')." },
            unit: { type: "string", enum: ["lb", "oz", "kg", "g", "gal", "l", "floz", "ml", "each", ""], description: "Unit of that quantity. 'floz' for fluid ounces, 'oz' for weight ounces." },
            supplier_lot: { type: "string", description: "The supplier's lot or batch number for this line, if printed. Empty if not shown." },
            cost: { type: "number", description: "Line total in dollars (not unit price), if shown." },
          },
          required: ["ingredient", "amount", "unit", "supplier_lot"],
        },
      },
    },
    required: ["supplier", "invoice_number", "invoice_date", "items"],
  },
} as const;

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Tidy what the model returned; anything odd becomes empty rather than wrong. */
export function cleanReading(raw: unknown): InvoiceReading {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const num = (v: unknown) => {
    const n = typeof v === "number" ? Math.round(v * 100) / 100 : typeof v === "string" ? parseMoney(v) : null;
    return n !== null && Number.isFinite(n) && n >= 0 ? n : null;
  };
  const date = str(o.invoice_date, 10);
  const units = new Set(SUPPLY_UNITS.map((u) => u.key as string));
  const items = (Array.isArray(o.items) ? o.items : [])
    .slice(0, 60)
    .map((it): InvoiceItem => {
      const i = (it && typeof it === "object" ? it : {}) as Record<string, unknown>;
      const unit = str(i.unit, 10).toLowerCase().replace("fl oz", "floz");
      const amount = str(i.amount, 20).replace(/[^\d./]/g, "");
      return {
        ingredient: str(i.ingredient, 120),
        amount,
        unit: amount && units.has(unit) ? (unit as SupplyUnit) : "",
        supplier_lot: str(i.supplier_lot, 60),
        cost: num(i.cost),
      };
    })
    .filter((i) => i.ingredient);
  return {
    supplier: str(o.supplier, 120),
    invoice_number: str(o.invoice_number, 60),
    invoice_date: DATE.test(date) && !Number.isNaN(Date.parse(date)) ? date : null,
    total: num(o.total),
    items,
  };
}

/** Ask Claude to read the invoice. Throws with a plain-words message on failure. */
export async function readInvoiceFile(bytes: Uint8Array, mediaType: "image/jpeg" | "image/png" | "application/pdf"): Promise<InvoiceReading> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("Invoice reading isn't set up yet.");
  const data = Buffer.from(bytes).toString("base64");
  const file =
    mediaType === "application/pdf"
      ? { type: "document", source: { type: "base64", media_type: mediaType, data } }
      : { type: "image", source: { type: "base64", media_type: mediaType, data } };
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: INVOICE_MODEL,
      max_tokens: 4000,
      tools: [TOOL],
      tool_choice: { type: "tool", name: TOOL.name },
      messages: [
        {
          role: "user",
          content: [
            file,
            {
              type: "text",
              text:
                "This is a supplier invoice, receipt or packing slip for a small-batch cosmetics or candle maker. " +
                "Record the supplier, invoice number, date and each product line: what it is, total quantity received with its unit, " +
                "the supplier's lot or batch number if printed, and the line's total cost. Copy lot numbers exactly. " +
                "Leave a field empty rather than guessing.",
            },
          ],
        },
      ],
    }),
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error("The invoice reader's API key isn't working. Check it in your Vercel settings.");
    if (res.status === 429 || res.status === 529) throw new Error("The invoice reader is busy. Try again in a minute.");
    throw new Error("We couldn't read that invoice. Try a clearer photo, or enter the items by hand.");
  }
  const body = (await res.json()) as { content?: { type: string; name?: string; input?: unknown }[] };
  const use = body.content?.find((c) => c.type === "tool_use" && c.name === TOOL.name);
  if (!use) throw new Error("We couldn't read that invoice. Try a clearer photo, or enter the items by hand.");
  return cleanReading(use.input);
}
