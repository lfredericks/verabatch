import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { brand, brandText, pageTitle } from "@/lib/brand";
import { BrandMark } from "../../../../BrandMark";
import { CopyButtons } from "./CopyButtons";
import { labelPdfFor, loadLabel, readLogoChoice } from "./data";
import { LabelPreview } from "./LabelPreview";
import { CanvaButton } from "./CanvaButton";
import { canvaConfigured } from "@/lib/canva";
import { LABEL_FONTS_WEB } from "@/lib/labelFonts/web";
import { logoUrl } from "@/lib/logos";

export const metadata: Metadata = { title: pageTitle("Label") };
export const dynamic = "force-dynamic";

export default async function LabelPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ size?: string; batch?: string; ls?: string; logo?: string | string[]; canva?: string }>;
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
  // Logo links for the preview, in the same order the PDF placed them.
  const logoLinks = (await Promise.all(loaded.frontLogos.map((p) => logoUrl(loaded.supabase, p)))).filter((u): u is string => Boolean(u));
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
  const ready = label.blockers.length === 0;
  const canva = canvaConfigured();
  const canvaNote =
    {
      back: "Back from Canva. Your design is saved in your Canva account.",
      connected: "Canva connected.",
      declined: "Canva wasn't connected. Tap Open in Canva to try again.",
      failed: "Canva didn't open the label this time. Try again, or download the PDF and upload it in Canva.",
      nosize: "Add the label size first, then Open in Canva.",
    }[sp.canva ?? ""] ?? null;
  const backText = label.back.join("\n");

  return (
    <main className="wrap narrow">
      <BrandMark href="/app" />
      <Link href={`/app/products/${id}`} className="backlink">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" />
        </svg>
        {product.name}
        {size ? ` · ${size.name}` : ""}
      </Link>
      <div className="win">
        {ready ? (
          <span className="win-mark" aria-hidden="true">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12l4 4 10-10" />
            </svg>
          </span>
        ) : null}
        <h1>{ready ? "Your label is ready" : "Almost ready"}</h1>
        <p className="hint">
          {ready
            ? "No problems found in the ingredient names, net weight size or warnings. Review it yourself before you print."
            : "Fix these before you print."}
        </p>
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

      {!ready && (
        <div className="note" role="status">
          <ul className="tight">
            {label.blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      )}

      {"pdf" in made ? (
        <>
          <link rel="stylesheet" href={LABEL_FONTS_WEB.css} />
          <LabelPreview
            preview={made.pdf.preview}
            fonts={{ serif: LABEL_FONTS_WEB.serif, sans: LABEL_FONTS_WEB.sans }}
            logos={logoLinks}
            sizeText={label.size?.labelText ?? null}
            cutOff={made.pdf.backCutOff}
          />
        </>
      ) : (
        <div className="note">
          <pre className="label-text">{label.front.join("\n")}</pre>
        </div>
      )}
      {label.size?.lettering && (
        <p className="hint center">
          Net weight letters at least <b>{label.size.lettering.minHeight}</b> tall ({label.size.areaSqIn!.toFixed(1)} sq in front panel).
        </p>
      )}
      {label.approximate && (
        <p className="hint">No size yet, so the net weight is the batch divided by how many it makes, from typical values. Add a size for an exact one.</p>
      )}

      <p className="note">
        <b>You&rsquo;re responsible for this label.</b> {brandText(brand.disclaimerShort)} Have it reviewed by a regulatory consultant or attorney
        before you sell. <Link href="/disclaimer">Full disclaimer</Link>
      </p>
      {canvaNote && (
        <p className={sp.canva === "back" || sp.canva === "connected" ? "status" : "note"} role="status">
          {canvaNote}
        </p>
      )}
      {"pdf" in made ? (
        <div className="bigbtns">
          {canva ? (
            <>
              <CanvaButton href={`/app/products/${id}/label/canva?${pdfQuery}`} />
              <a href={`${pdfHref}&download=1`} className="bigbtn">
                Download PDF
              </a>
            </>
          ) : (
            <a href={`${pdfHref}&download=1`} className="bigbtn bigbtn-pri">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
              </svg>
              Download PDF
            </a>
          )}
          <Link href={`/app/products/${id}/batches/new`} className="bigbtn">
            I made a batch
          </Link>
          {!canva && (
            <a href={pdfHref} target="_blank" rel="noopener" className="bigbtn">
              Open the PDF
            </a>
          )}
        </div>
      ) : (
        <p className="note">{made.missing}</p>
      )}
      {canva && <p className="hint center">The first time, Canva asks you to connect your account. After that it&rsquo;s one tap.</p>}
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

      {"pdf" in made && made.pdf.warnings.length > 0 && (
        <div className="note">
          <ul className="tight">
            {made.pdf.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
          {made.suggest.length > 0 && (
            <>
              <p>
                <b>These fit the whole back at the FDA minimum letter size:</b>
              </p>
              <ul className="tight">
                {made.suggest.map((x) => (
                  <li key={x.id}>{x.label}</li>
                ))}
              </ul>
              <Link href={`/app/products/${id}#sizes`} className="btn sm cta">
                Change the label size
              </Link>
            </>
          )}
        </div>
      )}

      {"pdf" in made && (has.product || has.business) && (
        <details className="card">
          <summary>
            <b>Logos on the front</b>
          </summary>
          <form method="get" className="fld">
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
            <p className="hint">Both ticked: side by side at the top.</p>
            <button className="btn sm cta">Update the label</button>
          </form>
        </details>
      )}

      <section className="card">
        <CopyButtons front={frontText} back={backText} />
        <p className="hint">Or paste the text into Canva or your label app. Check every label before you print.</p>
      </section>

      <Link href={`/app/products/${id}`} className="btn ghost cta">
        Back to {product.name}
      </Link>
    </main>
  );
}
