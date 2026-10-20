import Link from "next/link";
import { activeTheme, brand } from "@/lib/brand";

/** The logo: mark plus product name. Use this everywhere instead of typing the name. */
export function BrandMark({ href, mark = activeTheme().mark }: { href?: string; mark?: string }) {
  const inner = (
    <>
      {mark !== "none" && <span className={`mark mark-${mark}`} aria-hidden="true" />}
      <span>{brand.name}</span>
    </>
  );
  return href ? (
    <Link href={href} className="brand" aria-label={`${brand.name} home`}>
      {inner}
    </Link>
  ) : (
    <div className="brand">{inner}</div>
  );
}
