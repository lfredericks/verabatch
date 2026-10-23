import type { Metadata } from "next";
import Link from "next/link";
import { brand, brandText, pageTitle } from "@/lib/brand";
import { BrandMark } from "../BrandMark";

export const metadata: Metadata = { title: pageTitle("Disclaimer") };

export default function DisclaimerPage() {
  return (
    <main className="wrap narrow">
      <BrandMark href="/" />
      <h1>Disclaimer</h1>
      {brand.disclaimer.map((d) => (
        <section key={d.heading} className="stack">
          <h2>{d.heading}</h2>
          <p>{brandText(d.text)}</p>
        </section>
      ))}
      <Link href="/app" className="btn ghost cta">
        Back to the app
      </Link>
    </main>
  );
}
