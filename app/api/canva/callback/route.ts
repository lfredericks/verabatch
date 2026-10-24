import { NextResponse, type NextRequest } from "next/server";
import { exchangeCode, saveTokens } from "@/lib/canva";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Canva sends the person back here after they approve the connection. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const next = req.cookies.get("canva_next")?.value ?? "/app";
  const back = (status: string) => {
    const u = new URL(next.startsWith("/app") ? next : "/app", req.url);
    u.searchParams.set("canva", status);
    const res = NextResponse.redirect(u);
    for (const c of ["canva_pkce", "canva_state", "canva_next"]) res.cookies.set(c, "", { path: "/api/canva", maxAge: 0 });
    return res;
  };
  const code = q.get("code");
  const state = q.get("state");
  const verifier = req.cookies.get("canva_pkce")?.value;
  if (!code || !state || !verifier || state !== req.cookies.get("canva_state")?.value) return back("declined");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));
  try {
    const tokens = await exchangeCode(code, verifier, new URL("/api/canva/callback", req.url).toString());
    await saveTokens(supabase, user.id, tokens);
  } catch {
    return back("failed");
  }
  // Straight on to opening the label, if that's what they were doing.
  const res = back("connected");
  if (next.includes("/label/canva")) res.headers.set("Location", new URL(next, req.url).toString());
  return res;
}
