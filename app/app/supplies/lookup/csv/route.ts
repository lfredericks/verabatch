import { NextResponse, type NextRequest } from "next/server";
import { lookupLot, toCsv } from "@/lib/lotLookup";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** The lot lookup as a spreadsheet: one row per batch that used the supplier lot. */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Sign in first.", { status: 401 });
  const lot = (req.nextUrl.searchParams.get("lot") ?? "").trim().slice(0, 60);
  const hits = await lookupLot(supabase, lot);
  const rows = [["Supply", "Supplier", "Supplier lot", "Product", "Our lot", "Made on"]];
  for (const h of hits)
    for (const b of h.batches) rows.push([h.supply.ingredient, h.supply.supplier, h.supply.supplier_lot, b.product, b.lot, b.made_on]);
  const name = `lot-${lot.replace(/[^\w-]/g, "") || "lookup"}.csv`;
  return new NextResponse(toCsv(rows), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "no-store" },
  });
}
