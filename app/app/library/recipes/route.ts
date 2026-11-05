import { NextResponse } from "next/server";
import { loadAllRecipes, RECIPE_COLUMNS, toCsv } from "@/lib/productSheet";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Every product's whole recipe as a CSV file, one row per ingredient line. */
export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));
  const rows = await loadAllRecipes(supabase);
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(toCsv(RECIPE_COLUMNS, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="All-recipes_${date}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
