import Link from "next/link";

/**
 * Top of a product page: who it is, whether its label is ready, the three things makers do
 * most (big buttons, Etsy-style), then a Shopify-style list of everything else on the page.
 */
export function ProductHero({
  productId,
  name,
  subtitle,
  logoUrl,
  blockers,
  rows,
}: {
  productId: string;
  name: string;
  subtitle: string;
  logoUrl: string | null;
  /** What still stops the label from printing. Empty = ready. */
  blockers: string[];
  rows: { href: string; title: string; detail: string }[];
}) {
  const ready = blockers.length === 0;
  return (
    <>
      <div className="hero">
        <div className="hero-art">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" />
          ) : (
            <svg width="44" height="44" viewBox="0 0 84 84" fill="none" aria-hidden="true">
              <rect x="16" y="22" width="52" height="12" rx="4" fill="currentColor" />
              <path d="M20 34h44v28a8 8 0 01-8 8H28a8 8 0 01-8-8z" stroke="currentColor" strokeWidth="3" />
              <rect x="27" y="42" width="30" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
            </svg>
          )}
        </div>
        <div className="hero-text">
          <h1>{name}</h1>
          {subtitle && <span>{subtitle}</span>}
        </div>
      </div>

      {ready ? (
        <p className="status" role="status">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M8 12l3 3 5-6" />
          </svg>
          Label ready to review. No problems found in the recipe, size or warnings.
        </p>
      ) : (
        <Link href={`/app/products/${productId}/label`} className="status status-warn">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v6M12 16.5v.5" />
          </svg>
          <span>
            {blockers.length === 1 ? "1 thing to fix" : `${blockers.length} things to fix`} before printing: {blockers[0]}
          </span>
        </Link>
      )}

      <div className="bigbtns">
        <Link href={`/app/products/${productId}/label`} className="bigbtn bigbtn-pri">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="4" y="3" width="16" height="18" rx="2" />
            <path d="M8 8h8M8 12h8M8 16h5" />
          </svg>
          Get my label
        </Link>
        <Link href={`/app/products/${productId}/batches/new`} className="bigbtn">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M8 3h8l-1 6 4 11H5L9 9z" />
            <path d="M7 15h10" />
          </svg>
          I made a batch
        </Link>
        <Link href="#desc" className="bigbtn">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 20h4L19 9l-4-4L4 16z" />
            <path d="M13 7l4 4" />
          </svg>
          Shop description
        </Link>
      </div>

      <nav className="navlist" aria-label="On this page">
        {rows.map((r) => (
          <a key={r.href} href={r.href}>
            <span>
              <b>{r.title}</b>
              <span>{r.detail}</span>
            </span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </a>
        ))}
      </nav>
    </>
  );
}
