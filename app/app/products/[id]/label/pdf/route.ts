import { NextResponse, type NextRequest } from "next/server";
import { labelPdfFor, loadLabel, pdfFileName } from "../data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** The label as a print-ready PDF: front on page 1, back on page 2, at the label's exact size. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const q = req.nextUrl.searchParams;
  const loaded = await loadLabel(id, q.get("size") ?? undefined, q.get("batch") ?? undefined);
  if (!loaded) return new NextResponse("Not found", { status: 404 });
  if (loaded.signedOut) return NextResponse.redirect(new URL("/login", req.url));
  const made = await labelPdfFor(loaded);
  if ("missing" in made) return new NextResponse(made.missing, { status: 400 });
  const name = pdfFileName(loaded.product.name, loaded.size!.name, loaded.batch?.lot as string | undefined);
  return new NextResponse(Buffer.from(made.pdf.bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${q.get("download") ? "attachment" : "inline"}; filename="${name}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
