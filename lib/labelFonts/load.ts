import { readFile } from "node:fs/promises";
import path from "node:path";
import type { LabelFontFiles } from "../labelPdf";

/**
 * The two label font families (both free, OFL-licensed, and in Canva's font list).
 * Read from disk on the server; next.config.mjs ships these files with the label routes.
 */
let cached: Promise<LabelFontFiles> | null = null;

export function loadLabelFonts(): Promise<LabelFontFiles> {
  if (!cached) {
    const dir = path.join(process.cwd(), "lib", "labelFonts");
    const read = (f: string) => readFile(path.join(dir, f)).then((b) => new Uint8Array(b));
    cached = Promise.all([read("LibreBaskerville-Regular.ttf"), read("Lato-Regular.ttf"), read("Lato-Bold.ttf")]).then(
      ([serif, sans, sansBold]) => ({ serif, sans, sansBold }),
    );
    cached.catch(() => (cached = null));
  }
  return cached;
}
