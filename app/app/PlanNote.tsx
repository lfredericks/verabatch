import Link from "next/link";

/** Shown where the Free plan stops: what it covers and that Pro is coming. */
export function PlanNote({ title, text, back }: { title: string; text: string; back: string }) {
  return (
    <section className="card plan-note" aria-labelledby="plan-note">
      <h2 id="plan-note">{title}</h2>
      <p>{text}</p>
      <Link href={back} className="btn cta">
        Back
      </Link>
    </section>
  );
}
