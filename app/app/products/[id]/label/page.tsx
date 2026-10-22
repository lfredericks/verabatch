import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { pageTitle } from "@/lib/brand";
import { BrandMark } from "../../../../BrandMark";
import { CopyButtons } from "./CopyButtons";
import { labelPdfFor, loadLabel, readLogoChoice } from "./data";

export const metadata: Metadata = { title: pageTitle("Label") };
export const dynamic = "force-dynamic";

export default async function LabelPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ size?: string; batch?: string; ls?: string; logo?: string | string[] }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const { size: sizeId, batch: batchParam } = sp;
  const raw = new URLSearchParams();
  if (sp.ls) raw.set("ls", sp.ls);
  for (const l of ([] as string[]).concat(sp.logo ?? [])) raw.append("logo", l);
  const loaded = await loadLabel(id, sizeId, batchParam, readLogoChoice(raw));
  if (!loaded) notFound();
  if (loaded.signedOut) redirect("/login");
  const { product, sizes, size, batches, batch, label, logos, has, fileName } = loaded;
  // Keep the logo choice when switching size or batch.
  const logoQuery = (q: URLSearchParams) => {
    if (!raw.get("ls")) return;
    q.set("ls", "1");
    if (logos.product) q.append("logo", "product");
    if (logos.business) q.append("logo", "business");
  };
  const made = await labelPdfFor(loaded);
  const link = (o: { size?: string | undefined; batch?: string | undefined }) => {
    const q = new URLSearchParams();
    const sz = o.size ?? size?.id;
    const bt = o.batch ?? (batch ? batch.id : "standard");
    if (sz) q.set("size", sz);
    if (bt) q.set("batch", bt);
    logoQuery(q);
    return `/app/products/${id}/label?${q}`;
  };
  const pdfQuery = new URLSearchParams();
  if (size) pdfQuery.set("size", size.id);
  if (batch) pdfQuery.set("batch", batch.id);
  logoQuery(pdfQuery);
  const pdfHref = `/app/products/${id}/label/pdf/${encodeURIComponent(fileName ?? "Label.pdf")}?${pdfQuery}`;
  const frontText = label.front.join("\n");
  const backText = label.back.join("\n");

  return (
    <main className="wrap narrow">
      <BrandMark href="/app" />
      <div>
        <p className="eyebrow">Label</p>
        <h1>{product.name}</h1>
      </div>

      {sizes.length > 1 && (
        <nav className="tabs" aria-label="Sizes">
          {sizes.map((s) => (
            <Link
              key={s.id}
              href={link({ size: s.id })}
              className={`btn sm${s.id === size?.id ? " pri" : ""}`}
              aria-current={s.id === size?.id ? "page" : undefined}
            >
              {s.name}
            </Link>
          ))}
        </nav>
      )}

      {batches.length > 0 && (
        <nav className="tabs" aria-label="Batches">
          <Link href={link({ batch: "standard" })} className={`btn sm${!batch ? " pri" : ""}`}>
            Usual recipe
          </Link>
          {batches.slice(0, 6).map((b) => (
            <Link
              key={b.id}
              href={link({ batch: b.id })}
              className={`btn sm${b.id === batch?.id ? " pri" : ""}`}
              aria-current={b.id === batch?.id ? "page" : undefined}
            >
              <span className="mono">{b.lot}</span>
            </Link>
          ))}
        </nav>
      )}

      {label.blockers.length > 0 && (
        <div className="note" role="status">
          <b>Before you print:</b>
          <ul className="tight">
            {label.blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      )}

      {label.customNames.length > 0 && (
        <div className="note">
          <b>Not official ingredient names:</b> {label.customNames.join(", ")}. You entered these yourself. Check them
          before you print.
        </div>
      )}

      {label.claims.length > 0 && (
        <div className="note">
          <b>Wording to check:</b>
          <ul className="tight">
            {label.claims.map((c) => (
              <li key={c.word}>
                &ldquo;{c.word}&rdquo;: {c.why} {c.fix}
              </li>
            ))}
          </ul>
        </div>
      )}

      <section className="card" aria-labelledby="front">
        <h2 id="front">Front{size ? ` · ${size.name}` : ""}</h2>
        <div className="lbl">
          <div className="nm">{product.name}</div>
          {product.identity && <div>{product.identity}</div>}
          {label.net && <div className="net">{label.net}</div>}
        </div>
        {label.size?.lettering ? (
          <p className="hint">
            Front label {label.size.labelText} ({label.size.areaSqIn!.toFixed(1)} sq in): net weight letters at least{" "}
            <b>{label.size.lettering.minHeight}</b> tall, in the bottom third of the front.
          </p>
        ) : (
          size && <p className="hint">Add this size&rsquo;s label dimensions to see the smallest letter size allowed.</p>
        )}
        {label.approximate && (
          <p className="hint">No size yet, so the net weight is the batch divided by how many it makes, from typical values. Add a size for an exact one.</p>
        )}
      </section>

      <section className="card" aria-labelledby="back">
        <h2 id="back">Back</h2>
        <div className="lbl">
          {label.back.map((line) => (
            <div key={line}>{label.warnings.includes(line) ? <b>{line}</b> : line}</div>
          ))}
        </div>
      </section>

      <section className="card" aria-labelledby="pdf">
        <h2 id="pdf">Print-ready PDF</h2>
        {"pdf" in made ? (
          <>
            <p className="hint">
              Front on page 1, back on page 2, each at your label&rsquo;s exact size ({label.size?.labelText}). Two fonts
              only, Libre Baskerville and Lato, both in Canva, so the text stays editable when you upload it there.
            </p>
            {(has.product || has.business) && (
              <form method="get" className="fld">
                <span>Logos on the front (both ticked: side by side)</span>
                {size && <input type="hidden" name="size" value={size.id} />}
                <input type="hidden" name="batch" value={batch ? batch.id : "standard"} />
                <input type="hidden" name="ls" value="1" />
                {has.product && (
                  <label className="radio">
                    <input type="checkbox" name="logo" value="product" defaultChecked={logos.product} /> Product logo
                  </label>
                )}
                {has.business && (
                  <label className="radio">
                    <input type="checkbox" name="logo" value="business" defaultChecked={logos.business} /> Business logo
                  </label>
                )}
                <button className="btn sm cta">Update the PDF</button>
              </form>
            )}
            {made.pdf.warnings.length > 0 && (
              <div className="note">
                <ul className="tight">
                  {made.pdf.warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="row">
              <a href={pdfHref} target="_blank" rel="noopener" className="btn pri cta">
                Open the PDF
              </a>
              <a href={`${pdfHref}&download=1`} className="btn cta">
                Download
              </a>
            </div>
            {label.blockers.length > 0 && <p className="hint">Fix the items under &ldquo;Before you print&rdquo; first.</p>}
          </>
        ) : (
          <p className="hint">{made.missing}</p>
        )}
      </section>

      <section className="card">
        <CopyButtons front={frontText} back={backText} />
        <p className="hint">Or paste the text into Canva or your label app. Check every label before you print.</p>
      </section>

      <div className="row">
        <Link href={`/app/products/${id}/batches/new`} className="btn cta">
          Log a batch (optional)
        </Link>
        <Link href={`/app/products/${id}`} className="btn ghost cta">
          Back to {product.name}
        </Link>
      </div>
    </main>
  );
}
