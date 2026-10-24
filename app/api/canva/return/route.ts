import { createRemoteJWKSet, jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const keys = createRemoteJWKSet(new URL("https://api.canva.com/rest/v1/connect/keys"));

/** Canva's "Return" button in the editor lands here: back to that product's label page. */
export async function GET(req: NextRequest) {
  const jwt = req.nextUrl.searchParams.get("correlation_jwt");
  if (!jwt) return NextResponse.redirect(new URL("/app", req.url));
  try {
    const { payload } = await jwtVerify(jwt, keys, { audience: process.env.CANVA_CLIENT_ID });
    const productId = String(payload.correlation_state ?? "");
    if (payload.type === "rti" && /^[0-9a-f-]{36}$/i.test(productId)) {
      return NextResponse.redirect(new URL(`/app/products/${productId}/label?canva=back`, req.url));
    }
  } catch {
    // Not a valid Canva return: just go home.
  }
  return NextResponse.redirect(new URL("/app", req.url));
}
