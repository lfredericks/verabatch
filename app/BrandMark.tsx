import Link from "next/link";
import { activeTheme, brand } from "@/lib/brand";

/** The logo: mark plus product name. Use this everywhere instead of typing the name. */
export function BrandMark({ href, mark = activeTheme().mark, reverse = false }: { href?: string; mark?: string; reverse?: boolean }) {
  const [lead, rest] = brand.wordmark ?? [brand.name, ""];
  const inner = (
    <>
      {mark !== "none" && <span className={`mark mark-${mark}`} aria-hidden="true" />}
      <span className="wordmark" aria-label={brand.name}>
        <span className="wm-lead">{lead}</span>
        {rest}
      </span>
    </>
  );
  const cls = reverse ? "brand reverse" : "brand";
  return href ? (
    <Link href={href} className={cls} aria-label={`${brand.name} home`}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}
