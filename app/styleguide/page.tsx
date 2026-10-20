import type { Metadata } from "next";
import Link from "next/link";
import { activeTheme, brand, googleFontsUrl, pageTitle, themeCss, THEMES, type ColorTokens } from "@/lib/brand";
import { BrandMark } from "../BrandMark";

export const metadata: Metadata = { title: pageTitle("Style guide"), robots: { index: false } };

const COLOR_NOTES: Record<keyof ColorTokens, string> = {
  paper: "Page background",
  surface: "Cards, inputs",
  sunk: "Recessed areas",
  ink: "Main text",
  muted: "Secondary text",
  line: "Borders",
  accent: "Brand color",
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
                <code>{k}</code>
                <code>
                  {theme.colors.light[k]} / {theme.colors.dark[k]}
                </code>
              </div>
            </div>
          ))}
        </div>
        <p className="hint">Each swatch shows light / dark values. Your device&rsquo;s dark mode setting decides which you see.</p>

        <h2 className="section">Type</h2>
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
