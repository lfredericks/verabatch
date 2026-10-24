import { NextResponse, type NextRequest } from "next/server";
import { accessToken, CanvaAuthError, canvaConfigured, importPdf, withReturn } from "@/lib/canva";
import { labelPdfFor, loadLabel, readLogoChoice } from "../data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Canva takes a few seconds to turn the PDF into a design.
export const maxDuration = 60;

/** "Open in Canva": the label PDF goes to the maker's Canva as a new editable design, then we open it. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const q = req.nextUrl.searchParams;
  const here = `${req.nextUrl.pathname}${req.nextUrl.search}`;
  const labelPage = new URL(`/app/products/${id}/label${req.nextUrl.search}`, req.url);
  if (!canvaConfigured()) return NextResponse.redirect(labelPage);

  const loaded = await loadLabel(id, q.get("size") ?? undefined, q.get("batch") ?? undefined, readLogoChoice(q));
  if (!loaded) return new NextResponse("Not found", { status: 404 });
  if (loaded.signedOut) return NextResponse.redirect(new URL("/login", req.url));
  const {
    data: { user },
  } = await loaded.supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const connect = () => NextResponse.redirect(new URL(`/api/canva/connect?next=${encodeURIComponent(here)}`, req.url));
  const token = await accessToken(loaded.supabase, user.id);
  if (!token) return connect();

  const made = await labelPdfFor(loaded);
  if ("missing" in made) {
    labelPage.searchParams.set("canva", "nosize");
    return NextResponse.redirect(labelPage);
  }
  try {
    const title = (loaded.fileName ?? loaded.product.name).replace(/\.pdf$/, "");
    const edit = await importPdf(token, made.pdf.bytes, title);
    return NextResponse.redirect(withReturn(edit, id));
  } catch (e) {
    if (e instanceof CanvaAuthError) {
      await loaded.supabase.from("canva_connections").delete().eq("user_id", user.id);
      return connect();
    }
    labelPage.searchParams.set("canva", "failed");
    return NextResponse.redirect(labelPage);
  }
}
