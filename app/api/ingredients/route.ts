import { NextResponse, type NextRequest } from "next/server";
import { suggestNames } from "@/lib/packs/cosmetics/nameSearch";

/** GET /api/ingredients?q=mugwort -> { names: ["Artemisia Vulgaris Extract", ...] } */
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").slice(0, 80);
  return NextResponse.json({ names: suggestNames(q) }, { headers: { "Cache-Control": "public, max-age=3600" } });
}
