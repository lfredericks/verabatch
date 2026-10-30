import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseKey, supabaseUrl } from "@/lib/supabase/env";

// Supabase pauses free projects after about a week with no database activity.
// Vercel calls this once a day (see vercel.json) so the database stays awake.
// It runs one tiny query and returns no data.
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient(supabaseUrl(), supabaseKey(), { auth: { persistSession: false } });
  const { error } = await supabase.from("businesses").select("id", { count: "exact", head: true });
  if (error) return NextResponse.json({ ok: false }, { status: 500 });
  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
