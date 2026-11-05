import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { pageTitle } from "@/lib/brand";
import { LIBRARY_COLUMNS, loadLibrary } from "@/lib/productSheet";
import { createClient } from "@/lib/supabase/server";
import { BrandMark } from "../../BrandMark";

export const metadata: Metadata = { title: pageTitle("Product library") };
export const dynamic = "force-dynamic";

/** Every product as one row, like a spreadsheet, with a download. */
export default async function Library() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const rows = await loadLibrary(supabase);

  return (
    <main className="wrap wide">
      <BrandMark href="/app" />
      <div className="row between">
        <h1>Product library</h1>
        <a href="/app/library/csv" className="btn sm cta" download>
          Download spreadsheet (.csv)
        </a>
      </div>
      <p className="hint">Opens in Excel, Numbers or Google Sheets. Click a product to open it.</p>
      {rows.length ? (
        <div className="table-scroll">
          <table className="grid-table">
            <thead>
              <tr>
                {LIBRARY_COLUMNS.map((c) => (
                  <th key={c.key} scope="col">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  {LIBRARY_COLUMNS.map((c) =>
                    c.key === "name" ? (
                      <th key={c.key} scope="row">
                        <Link href={`/app/products/${r.id}`}>{r.name}</Link>
                      </th>
                    ) : (
                      <td key={c.key} className={c.key === "label" && r.label !== "Ready" ? "warn-text" : undefined}>
                        {r[c.key] === null || r[c.key] === "" ? "" : String(r[c.key])}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No products yet.</p>
      )}
      <Link href="/app" className="btn ghost sm cta">
        Back to your shop
      </Link>
    </main>
  );
}
