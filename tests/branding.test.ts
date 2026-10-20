import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { brand, THEMES } from "../lib/brand";
import type { ColorTokens } from "../lib/brand";

/** All app source files (screens and styles). */
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.(tsx?|css)$/.test(f) ? [p] : [];
  });
}

describe("branding stays in lib/brand", () => {
  const app = files("app");

  it("no raw colors in app/", () => {
    const hits = app.filter((f) => /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/.test(readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "")));
    expect(hits).toEqual([]);
  });

  it("product name is never typed in app/", () => {
    const hits = app.filter((f) => readFileSync(f, "utf8").includes(brand.name));
    expect(hits).toEqual([]);
  });

  it("every theme defines every color in light and dark", () => {
    const keys = Object.keys(THEMES[0]!.colors.light).sort() as (keyof ColorTokens)[];
    for (const t of THEMES) {
      expect(Object.keys(t.colors.light).sort()).toEqual(keys);
      expect(Object.keys(t.colors.dark).sort()).toEqual(keys);
    }
  });
});
