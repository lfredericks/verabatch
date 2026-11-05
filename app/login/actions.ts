"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface LoginState {
  step: "email" | "code";
  email: string;
  error?: string;
  /** Signing in to reset a forgotten password: land on the password box. */
  reset?: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Step 1: email the person a sign-in code. New emails get an account automatically. */
export async function sendCode(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const reset = form.get("reset") === "1";
  if (!EMAIL_RE.test(email)) return { step: "email", email, reset, error: "Enter an email address like you@yourshop.com." };
  const supabase = await createClient();
  // The email (supabase/email-templates/sign-in.html) has a code and a link to /auth/confirm.
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const emailRedirectTo = host ? `${proto}://${host}/auth/confirm?next=${reset ? "/app?password=reset" : "/app"}` : undefined;
  // A password reset never creates an account.
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: !reset, emailRedirectTo } });
  if (error) {
    console.error("sign-in email failed:", error.status, error.message);
    const tooMany = /rate|too many|security purposes/i.test(error.message);
    if (reset && !tooMany) return { step: "code", email, reset };
    return {
      step: "email",
      email,
      reset,
      error: tooMany
        ? "Too many sign-in emails in a row. Wait a few minutes, then try once."
        : "We couldn't send the sign-in email just now. Wait a minute and try again.",
    };
  }
  return { step: "code", email, reset };
}

/** Step 2: check the code from the email and sign in. */
export async function verifyCode(prev: LoginState, form: FormData): Promise<LoginState> {
  // The email comes from a hidden field: prev only holds the form's first (empty) state.
  const email = String(form.get("email") ?? prev.email ?? "").trim().toLowerCase();
  const reset = form.get("reset") === "1";
  const token = String(form.get("code") ?? "").replace(/\s/g, "");
  if (!/^\d{6,10}$/.test(token)) return { step: "code", email, error: "Enter the code from the email. It's only numbers." };
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) return { step: "code", email, reset, error: "That code didn't work. It may have expired, so ask for a new one." };
  redirect(reset ? "/app?password=reset#signin" : "/app");
}

/** Sign in with a password the person set on their account page. */
export async function signInPassword(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!EMAIL_RE.test(email)) return { step: "email", email, error: "Enter an email address like you@yourshop.com." };
  if (!password) return { step: "email", email, error: "Enter your password, or get a sign-in code instead." };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const tooMany = /rate|too many/i.test(error.message);
    return {
      step: "email",
      email,
      error: tooMany
        ? "Too many tries. Wait a few minutes, or get a sign-in code instead."
        : "That email and password don't match. No password yet? Get a sign-in code instead.",
    };
  }
  redirect("/app");
}
