import { NextResponse, type NextRequest } from "next/server";
import { authorizeUrl, canvaConfigured, newSignIn } from "@/lib/canva";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Start connecting this person's Canva. `next` = where to go afterwards (a page in the app). */
export async function GET(req: NextRequest) {
  if (!canvaConfigured()) return new NextResponse("Open in Canva isn't set up yet.", { status: 503 });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));
  const next = req.nextUrl.searchParams.get("next") ?? "/app";
  const safeNext = next.startsWith("/app") ? next : "/app";
  const { verifier, challenge, state } = newSignIn();
  const redirectUri = new URL("/api/canva/callback", req.url).toString();
  const res = NextResponse.redirect(authorizeUrl(challenge, state, redirectUri));
  const opts = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/api/canva", maxAge: 600 };
  res.cookies.set("canva_pkce", verifier, opts);
  res.cookies.set("canva_state", state, opts);
  res.cookies.set("canva_next", safeNext, opts);
  return res;
}
