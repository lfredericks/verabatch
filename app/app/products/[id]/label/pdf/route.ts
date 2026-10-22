import type { NextRequest } from "next/server";
import { labelPdfResponse } from "../data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return labelPdfResponse(req, (await params).id);
}
