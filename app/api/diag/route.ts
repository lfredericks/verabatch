import { NextResponse, type NextRequest } from "next/server";

/**
 * Temporary: receives browser-side events from signed-in pages (taps on buttons,
 * form submits, validation failures, script errors) and writes them to the server
 * log, to find why saving does nothing on iPhone Safari. No form contents are sent.
 */
export async function POST(req: NextRequest) {
  let body = "";
  try {
    body = (await req.text()).slice(0, 4000);
  } catch {
    /* ignore */
  }
  console.log("[diag]", req.headers.get("user-agent")?.slice(0, 160), body);
  return new NextResponse(null, { status: 204 });
}
