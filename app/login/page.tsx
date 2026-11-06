import type { Metadata } from "next";
import { pageTitle } from "@/lib/brand";
import { BrandMark } from "../BrandMark";
import { GoogleMark } from "@/lib/brand/GoogleMark";
import { signInGoogle } from "./actions";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: pageTitle("Sign in") };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ google?: string }> }) {
  const { google } = await searchParams;
  return (
    <main className="wrap narrow">
      <BrandMark href="/" />
      <h1>Sign in</h1>
      <p className="lead">We'll email you a sign-in code, or use your password if you've set one. New here? The code creates your account.</p>
      <form action={signInGoogle} className="google-form">
        <button className="btn google">
          <GoogleMark />
          Continue with Google
        </button>
        {google === "failed" && <p className="error" role="alert">Google sign-in isn't working just now. Use the email code instead.</p>}
      </form>
      <p className="or-line"><span>or</span></p>
      <LoginForm />
    </main>
  );
}
