"use server";

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
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (error) {
    const tooMany = /rate|too many|security purposes/i.test(error.message);
    return {
      step: "email",
      email,
      error: tooMany
        ? "Too many codes requested. Wait a minute, then try again."
        : "We couldn't send a code to that address. Check it and try again.",
    };
  }
  return { step: "code", email };
}

/** Step 2: check the code from the email and sign in. */
export async function verifyCode(prev: LoginState, form: FormData): Promise<LoginState> {
  const token = String(form.get("code") ?? "").replace(/\s/g, "");
  if (!/^\d{6,10}$/.test(token)) return { ...prev, error: "Enter the code from the email. It's only numbers." };
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email: prev.email, token, type: "email" });
  if (error) return { ...prev, error: "That code didn't work. It may have expired, so ask for a new one." };
  redirect("/app");
}
