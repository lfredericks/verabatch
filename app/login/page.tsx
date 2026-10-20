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
      <p className="lead">No password. We'll email you a sign-in link. New here? The same steps create your account.</p>
      <LoginForm />
    </main>
  );
}
