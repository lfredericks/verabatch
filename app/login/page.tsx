import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in · Verabatch" };

export default function LoginPage() {
  return (
    <main className="wrap narrow">
      <Link href="/" className="brand" aria-label="Verabatch home">
        <span className="mark" aria-hidden="true" />
        <span>Verabatch</span>
      </Link>
      <h1>Sign in</h1>
      <p className="lead">No password. We'll email you a sign-in link. New here? The same steps create your account.</p>
      <LoginForm />
    </main>
  );
}
