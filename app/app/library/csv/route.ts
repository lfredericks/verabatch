import { NextResponse } from "next/server";
import { libraryCsv, loadLibrary } from "@/lib/productSheet";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** The product library as a CSV file (opens in Excel, Numbers and Google Sheets). */
export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));
  const rows = await loadLibrary(supabase);
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(libraryCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="Product-library_${date}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
