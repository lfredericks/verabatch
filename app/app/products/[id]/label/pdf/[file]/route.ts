import type { NextRequest } from "next/server";
import { labelPdfResponse } from "../../data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Same PDF; the last part of the link is only the file name. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; file: string }> }) {
  return labelPdfResponse(req, (await params).id);
}
