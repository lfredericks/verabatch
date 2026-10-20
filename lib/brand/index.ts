import type { ColorTokens, Theme } from "./types";
import { defaultTheme } from "./themes/default";
import { bakeryTheme } from "./themes/bakery";

export { brand, brandText, pageTitle } from "./brand";
export type { Brand, Theme, ColorTokens } from "./types";

/** Every theme. Add a new file in themes/ and list it here. */
export const THEMES: Theme[] = [defaultTheme, bakeryTheme];

/**
 * The theme the site uses. Set NEXT_PUBLIC_THEME in Vercel to switch
 * (e.g. "bakery"); unset means the default.
 */
export function activeTheme(id = process.env.NEXT_PUBLIC_THEME): Theme {
  return THEMES.find((t) => t.id === id) ?? defaultTheme;
}

/** "accentSoft" -> "--accent-soft" */
function varName(key: string): string {
  return "--" + key.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());
}

function colorVars(c: ColorTokens): string {
  return Object.entries(c)
    .map(([k, v]) => `${varName(k)}: ${v};`)
    .join(" ");
}

/** The CSS custom properties for a theme, scoped to `selector`. */
export function themeCss(theme: Theme, selector = ":root"): string {
  const shared = [
    `--display: ${theme.fonts.display.stack};`,
    `--body: ${theme.fonts.body.stack};`,
    `--mono: ${theme.fonts.mono.stack};`,
    `--radius-card: ${theme.radius.card};`,
    `--radius-control: ${theme.radius.control};`,
    `--radius-small: ${theme.radius.small};`,
  ].join(" ");
  return [
    `${selector} { ${colorVars(theme.colors.light)} ${shared} color-scheme: light; }`,
    `@media (prefers-color-scheme: dark) { ${selector} { ${colorVars(theme.colors.dark)} color-scheme: dark; } }`,
  ].join("\n");
}

/** Google Fonts stylesheet URL for a theme (or several), or null if none is needed. */
export function googleFontsUrl(...themes: Theme[]): string | null {
  const families = new Set<string>();
  for (const t of themes) {
    for (const f of Object.values(t.fonts)) if (f.google) families.add(f.google);
  }
  if (families.size === 0) return null;
  return `https://fonts.googleapis.com/css2?${[...families].map((f) => `family=${f}`).join("&")}&display=swap`;
}
