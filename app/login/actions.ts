"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface LoginState {
  step: "email" | "code";
  email: string;
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Step 1: email the person a sign-in code. New emails get an account automatically. */
export async function sendCode(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { step: "email", email, error: "Enter an email address like you@yourshop.com." };
  const supabase = await createClient();
  // The email (supabase/email-templates/sign-in.html) has a code and a link to /auth/confirm.
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const emailRedirectTo = host ? `${proto}://${host}/auth/confirm?next=/app` : undefined;
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo } });
  if (error) {
    console.error("sign-in email failed:", error.status, error.message);
    const tooMany = /rate|too many|security purposes/i.test(error.message);
    return {
      step: "email",
      email,
      error: tooMany
        ? "Too many sign-in emails in a row. Wait a few minutes, then try once."
        : "We couldn't send the sign-in email just now. Wait a minute and try again.",
    };
  }
  return { step: "code", email };
}

/** Step 2: check the code from the email and sign in. */
export async function verifyCode(prev: LoginState, form: FormData): Promise<LoginState> {
  // The email comes from a hidden field: prev only holds the form's first (empty) state.
  const email = String(form.get("email") ?? prev.email ?? "").trim().toLowerCase();
  const token = String(form.get("code") ?? "").replace(/\s/g, "");
  if (!/^\d{6,10}$/.test(token)) return { step: "code", email, error: "Enter the code from the email. It's only numbers." };
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) return { step: "code", email, error: "That code didn't work. It may have expired, so ask for a new one." };
  redirect("/app");
}
