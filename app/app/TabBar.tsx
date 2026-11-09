import Link from "next/link";

export type Tab = "products" | "batches" | "supplies" | "shop";

const TABS: { key: Tab; href: string; label: string; icon: React.ReactNode }[] = [
  {
    key: "products",
    href: "/app",
    label: "Products",
    icon: (
      <>
        <rect x="4" y="9" width="16" height="11" rx="2" />
        <path d="M7 9V6h10v3" />
      </>
    ),
  },
  { key: "batches", href: "/app/batches", label: "Batches", icon: <path d="M8 3h8l-1 6 4 11H5L9 9z" /> },
  {
    key: "supplies",
    href: "/app/supplies",
    label: "Supplies",
    icon: (
      <>
        <path d="M3 7l9-4 9 4-9 4z" />
        <path d="M3 7v10l9 4 9-4V7" />
      </>
    ),
  },
  {
    key: "shop",
    href: "/app/shop",
    label: "My shop",
    icon: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
      </>
    ),
  },
];

/**
 * The bar of four tabs at the bottom of each main screen (Products, Batches, Supplies, My shop).
 * Only on the four tab screens, never inside a step-by-step flow.
 */
export function TabBar({ active }: { active: Tab }) {
  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map((t) => (
        <Link key={t.key} href={t.href} className="tab" aria-current={t.key === active ? "page" : undefined}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {t.icon}
          </svg>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
