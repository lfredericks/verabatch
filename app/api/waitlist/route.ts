import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { brand } from "@/lib/brand";
import { supabaseKey, supabaseUrl } from "@/lib/supabase/env";
import { domainTakesMail } from "@/lib/emailDomain";
import { cleanWaitlist, safeReturnUrl, WAITLIST_ORIGINS, type WaitlistInput } from "@/lib/waitlist";
import { waitlistWelcomeEmail } from "@/lib/waitlistEmail";

// Waitlist signups from the WordPress form on the website (docs/waitlist-form.html).
// Saves the signup (insert-only table, migration 0015), adds the person to Resend's contacts
// (and the waitlist segment, if RESEND_WAITLIST_SEGMENT_ID is set), then sends one welcome email.
// The form sends JSON with fetch and shows its own thank-you; without JavaScript it posts
// normally and lands on the `return` page.
export const dynamic = "force-dynamic";

const FROM_ADDRESS = "hello@verabatch.com";

function cors(origin: string | null): Record<string, string> {
  const allow = origin && WAITLIST_ORIGINS.includes(origin) ? origin : WAITLIST_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

export function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: cors(req.headers.get("origin")) });
}

async function readInput(req: NextRequest): Promise<{ input: WaitlistInput; json: boolean }> {
  const type = req.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const input: WaitlistInput = {};
    for (const [k, v] of Object.entries(body)) {
      if (typeof v === "string") input[k] = v;
      else if (Array.isArray(v)) input[k] = v.filter((x): x is string => typeof x === "string");
    }
    return { input, json: true };
  }
  const form = await req.formData().catch(() => null);
  const input: WaitlistInput = {};
  form?.forEach((v, k) => {
    if (typeof v !== "string") return;
    const prev = input[k];
    input[k] = prev === undefined ? v : [...(Array.isArray(prev) ? prev : [prev]), v];
  });
  return { input, json: false };
}

async function resend(path: string, body: unknown): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const res = await fetch(`https://api.resend.com${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => null);
  if (!res?.ok) console.error("waitlist: resend", path, res?.status, await res?.text().catch(() => ""));
  return !!res?.ok;
}

export async function POST(req: NextRequest) {
  const headers = cors(req.headers.get("origin"));
  const { input, json } = await readInput(req);
  const back = safeReturnUrl(typeof input.return === "string" ? input.return : undefined, WAITLIST_ORIGINS[0]);
  const reply = (status: number, body: Record<string, unknown>) =>
    json
      ? NextResponse.json(body, { status, headers })
      : NextResponse.redirect(
          body.ok ? back : `${back}${back.includes("?") ? "&" : "?"}waitlist=error`,
          303,
        );

  const checked = cleanWaitlist(input);
  if (!checked.ok) {
    // Bots get a cheerful "done" so they don't learn anything.
    if (checked.bot) return reply(200, { ok: true });
    return reply(400, { ok: false, error: checked.error });
  }
  const entry = checked.entry;
  if (!(await domainTakesMail(entry.email))) {
    return reply(400, { ok: false, error: "That email address can't receive mail. Please check it for typos." });
  }

  const supabase = createClient(supabaseUrl(), supabaseKey(), { auth: { persistSession: false } });
  const { error } = await supabase.from("waitlist").insert(entry);
  if (error) {
    // Already on the list: say so kindly, and don't email them again.
    if (error.code === "23505") return reply(200, { ok: true, already: true });
    console.error("waitlist: insert", error.code, error.message);
    return reply(500, { ok: false, error: "Something went wrong. Please try again in a minute." });
  }

  const segment = process.env.RESEND_WAITLIST_SEGMENT_ID;
  await resend("/contacts", {
    email: entry.email,
    first_name: entry.first_name,
    last_name: entry.last_name,
    unsubscribed: false,
    ...(segment ? { segments: [{ id: segment }] } : {}),
  });
  const mail = waitlistWelcomeEmail(entry.first_name);
  await resend("/emails", {
    from: `${brand.name} <${FROM_ADDRESS}>`,
    to: [`${entry.first_name} ${entry.last_name} <${entry.email}>`.replace(/[",]/g, "")],
    reply_to: FROM_ADDRESS,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
  });

  return reply(200, { ok: true });
}
