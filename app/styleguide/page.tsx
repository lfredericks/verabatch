import type { Metadata } from "next";
import Link from "next/link";
import { activeTheme, brand, googleFontsUrl, pageTitle, themeCss, THEMES, type ColorTokens } from "@/lib/brand";
import { BrandMark } from "../BrandMark";
import { fontName, LABEL_PDF_FONTS, loadedWeights, sizeText, TYPE_SCALE, WEIGHT_NAMES } from "./typeScale";

export const metadata: Metadata = { title: pageTitle("Style guide"), robots: { index: false } };

const COLOR_NOTES: Record<keyof ColorTokens, string> = {
  paper: "Page background",
  surface: "Cards, inputs",
  sunk: "Recessed areas",
  ink: "Main text",
  muted: "Secondary text",
  line: "Borders",
  accent: "Brand color",
  accentDeep: "Big button edge",
  accentSoft: "Accent highlight",
  onAccent: "Text on accent",
  warn: "Warning",
  warnSoft: "Warning background",
  danger: "Errors",
  success: "Success",
  label: "Label paper",
  labelInk: "Label text",
  labelAccent: "Label product name",
};

const FONT_ROLES = { display: "Headings and product names", body: "Everything else", mono: "Numbers and lot codes" };

function cssVar(key: string) {
  return "--" + key.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());
}

/**
 * Every design token and component on one page. Add ?theme=bakery to preview
 * another theme without changing the live site.
 */
export default async function StyleGuide({ searchParams }: { searchParams: Promise<{ theme?: string }> }) {
  const { theme: requested } = await searchParams;
  const live = activeTheme();
  const theme = activeTheme(requested ?? live.id);
  const fonts = googleFontsUrl(theme);

  return (
    <div className="sg-preview">
      {fonts && <link rel="stylesheet" href={fonts} />}
      <style
        dangerouslySetInnerHTML={{
          __html: themeCss(theme, ".sg-preview") + "\n.sg-preview { background: var(--paper); color: var(--ink); font-family: var(--body); min-height: 100vh; }",
        }}
      />
      <main className="wrap">
        <BrandMark href="/" mark={theme.mark} />
        <h1>Style guide</h1>
        <p className="lead">
          Showing <b>{theme.label}</b>. The live site uses <b>{live.label}</b>. Colors and fonts come from{" "}
          <code>lib/brand/themes/{theme.id}.ts</code>; words like the name &ldquo;{brand.name}&rdquo; come from{" "}
          <code>lib/brand/brand.ts</code>.
        </p>

        <div className="tabs">
          {THEMES.map((t) => (
            <Link key={t.id} href={`/styleguide?theme=${t.id}`} className={`btn sm${t.id === theme.id ? " pri" : ""}`}>
              {t.label}
            </Link>
          ))}
        </div>

        <h2 className="section">Colors</h2>
        <div className="swatches">
          {(Object.keys(COLOR_NOTES) as (keyof ColorTokens)[]).map((k) => (
            <div className="swatch" key={k}>
              <i style={{ background: `var(${cssVar(k)})` }} />
              <div>
                <b>{COLOR_NOTES[k]}</b>
                <code>{k} · {cssVar(k)}</code>
                <code>
                  {theme.colors.light[k]} / {theme.colors.dark[k]}
                </code>
              </div>
            </div>
          ))}
        </div>
        <p className="hint">Each swatch shows light / dark values. Your device&rsquo;s dark mode setting decides which you see.</p>

        <h2 className="section">Fonts</h2>
        <div className="sg-fonts">
          {(["display", "body", "mono"] as const).map((k) => {
            const f = theme.fonts[k];
            const weights = loadedWeights(f.google);
            return (
              <section className="card" key={k}>
                <p className="eyebrow">{FONT_ROLES[k]}</p>
                <p className="sg-font-name" style={{ fontFamily: `var(--${k})` }}>{fontName(f.stack)}</p>
                <p className="sg-font-abc" style={{ fontFamily: `var(--${k})` }}>Aa Bb Cc 0123456789</p>
                <dl className="sg-spec">
                  <dt>Weights</dt>
                  <dd>{weights.length ? weights.map((w) => `${WEIGHT_NAMES[w] ?? w} ${w}`).join(", ") : "Device font"}</dd>
                  <dt>Styles</dt>
                  <dd>Normal (no italics loaded)</dd>
                  <dt>CSS</dt>
                  <dd><code>var(--{k})</code></dd>
                  <dt>Fallbacks</dt>
                  <dd><code>{f.stack}</code></dd>
                </dl>
              </section>
            );
          })}
        </div>

        <h2 className="section">Type styles</h2>
        <div className="sg-types">
          {TYPE_SCALE.map((t) => {
            const fg = t.color[0]!;
            const bg = t.on;
            return (
              <section className="card sg-type" key={t.name}>
                <div
                  className="sg-sample"
                  style={{
                    fontFamily: `var(--${t.font})`,
                    fontSize: Array.isArray(t.rem) ? `clamp(${t.rem[0]}rem, 7vw, ${t.rem[1]}rem)` : `${t.rem}rem`,
                    fontWeight: t.weight,
                    lineHeight: t.lineHeight ?? 1.3,
                    color: `var(${cssVar(fg)})`,
                    background: bg ? `var(${cssVar(bg)})` : undefined,
                    padding: bg ? "6px 12px" : undefined,
                    borderRadius: bg ? "var(--radius-small)" : undefined,
                    ...t.css,
                  }}
                >
                  {t.name === "Wordmark" && brand.wordmark ? (
                    <>
                      <span style={{ color: "var(--accent)" }}>{brand.wordmark[0]}</span>
                      <span style={{ color: "var(--ink)" }}>{brand.wordmark[1]}</span>
                    </>
                  ) : (
                    t.sample
                  )}
                </div>
                <div>
                  <b>{t.name}</b> <span className="hint">{t.use}</span>
                </div>
                <dl className="sg-spec">
                  <dt>Font</dt>
                  <dd>{fontName(theme.fonts[t.font].stack)}</dd>
                  <dt>Size</dt>
                  <dd>{sizeText(t.rem)}</dd>
                  <dt>Weight</dt>
                  <dd>{WEIGHT_NAMES[t.weight]} {t.weight}</dd>
                  <dt>Style</dt>
                  <dd>{t.style ?? "Normal"}</dd>
                  {t.lineHeight && (
                    <>
                      <dt>Line height</dt>
                      <dd>{t.lineHeight}</dd>
                    </>
                  )}
                  <dt>Color</dt>
                  <dd>
                    {[...t.color, ...(t.on ? [t.on] : [])].map((c) => (
                      <span key={c} className="sg-chip">
                        <i style={{ background: `var(${cssVar(c)})` }} />
                        {c === t.on ? "on " : ""}
                        {c} <code>{theme.colors.light[c]} / {theme.colors.dark[c]}</code>
                      </span>
                    ))}
                  </dd>
                </dl>
              </section>
            );
          })}
        </div>
        <p className="hint">Sizes in rem: 1rem = 16px. Ranges grow with the screen, phone to desktop. Colors show light / dark.</p>

        <h2 className="section">Printed label (PDF)</h2>
        <section className="card">
          <p className="hint" style={{ margin: 0 }}>
            The label PDF always uses these two fonts, whatever the theme, so text stays editable in Canva. Text prints
            black.
          </p>
          <table className="grid-table sg-pdf">
            <thead>
              <tr>
                <th>Font</th>
                <th>Weight</th>
                <th>Used for</th>
                <th>Size</th>
              </tr>
            </thead>
            <tbody>
              {LABEL_PDF_FONTS.map((f) => (
                <tr key={f.font + f.weight}>
                  <th>{f.font}</th>
                  <td>{WEIGHT_NAMES[f.weight]} {f.weight}</td>
                  <td>{f.use}</td>
                  <td>{f.size}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <h2 className="section">Type in use</h2>
        <section className="card">
          <h1>Display: Midnight Garden</h1>
          <p className="lead">Body: Type your recipe the way you make it.</p>
          <p style={{ fontFamily: "var(--mono)" }}>Mono: Lot MG-261020-1 · 12 oz · 340 g</p>
          <p className="eyebrow">Section label</p>
          <p className="hint">Hint text</p>
          <p className="error">Error message</p>
          <p className="ok">Saved.</p>
        </section>

        <h2 className="section">Buttons and fields</h2>
        <section className="card form">
          <div className="row">
            <button className="btn pri" type="button">Main button</button>
            <button className="btn" type="button">Second button</button>
            <button className="btn ghost" type="button">Quiet button</button>
            <button className="btn sm" type="button">Small</button>
          </div>
          <label className="fld">
            <span>Field label</span>
            <input placeholder="Placeholder text" />
          </label>
          <p className="note">A warning note, like the one about cups and spoons being approximate.</p>
        </section>

        <h2 className="section">Label preview</h2>
        <div className="lbl">
          <div className="nm">Midnight Garden</div>
          <div>Whipped Body Butter</div>
          <div>Net wt 4 oz (113 g)</div>
          <div>
            <b>Ingredients:</b> Butyrospermum Parkii (Shea) Butter, Prunus Amygdalus Dulcis (Sweet Almond) Oil.
          </div>
          <div className="mono">Lot MG-261020-1</div>
        </div>
      </main>
    </div>
  );
}
