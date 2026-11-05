import { NextResponse, type NextRequest } from "next/server";
import { loadLabelFonts } from "@/lib/labelFonts/load";
import { loadSheet, sheetFileName } from "@/lib/productSheet";
import { buildSheetPdf } from "@/lib/productSheetPdf";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** A product sheet PDF: ?kind=buyer (shareable) or internal (recipe and batches). */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));
  const kind = req.nextUrl.searchParams.get("kind") === "internal" ? "internal" : "buyer";
  const data = await loadSheet(supabase, (await params).id, kind);
  if (!data) return new NextResponse("Not found", { status: 404 });
  const name = sheetFileName(data);
  const bytes = await buildSheetPdf(data, await loadLabelFonts(), name.replace(/\.pdf$/, ""));
  const ascii = name.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${req.nextUrl.searchParams.get("download") ? "attachment" : "inline"}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`,
      "Cache-Control": "private, no-store",
    },
  });
}
