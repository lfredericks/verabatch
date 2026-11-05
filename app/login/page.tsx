import type { Metadata } from "next";
import { pageTitle } from "@/lib/brand";
import { BrandMark } from "../BrandMark";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: pageTitle("Sign in") };

export default function LoginPage() {
  return (
    <main className="wrap narrow">
      <BrandMark href="/" />
      <h1>Sign in</h1>
      <p className="lead">We'll email you a sign-in code, or use your password if you've set one. New here? The code creates your account.</p>
      <LoginForm />
    </main>
  );
}
