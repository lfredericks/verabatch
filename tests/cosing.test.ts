/**
 * Every label name the cosmetics pack can print must be an official INCI name in CosIng,
 * or be on the list below with a reason. US INCI adds common names in brackets ("(Shea)")
 * that CosIng leaves out, so brackets are ignored when comparing.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { allLabelNames } from "../lib/packs/cosmetics";

const norm = (s: string) => s.replace(/\([^)]*\)/g, " ").replace(/[^A-Za-z0-9/-]+/g, " ").trim().replace(/\s+/g, " ").toUpperCase();

const cosing = new Set(
  readFileSync("data/cosing-inci-names.txt", "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map(norm),
);

/** Names allowed without a CosIng match, and why. Keep this list short and honest. */
const EXCEPTIONS: Record<string, string> = {
  Water: "US label name; CosIng (EU) says AQUA.",
  Fragrance: "US label name; CosIng (EU) says PARFUM.",
  "Euphorbia Cerifera (Candelilla) Wax": "US label name; CosIng (EU) says EUPHORBIA CERIFERA CERA.",
  "Boswellia Sacra Oil": "Not in our 2016 CosIng copy. Check against a current list.",
  "Santalum Spicatum Wood Oil": "Not in our 2016 CosIng copy. Check against a current list.",
  // Whole dried plant parts. CosIng lists powders and extracts; the dried-herb name is a draft.
  "Anthemis Nobilis Flower": "Dried flowers: draft name, check.",
  "Cinnamomum Zeylanicum Bark": "Dried bark: draft name, check.",
  "Cinnamomum Zeylanicum Leaf": "Dried leaf: draft name, check.",
  "Eugenia Caryophyllus (Clove) Bud": "Dried buds: draft name, check.",
  "Lavandula Hybrida Flower": "Dried flowers: draft name, check.",
  "Salvia Sclarea Leaf": "Dried leaf: draft name, check.",
};

describe("label names vs CosIng", () => {
  it("loaded the CosIng name list", () => {
    expect(cosing.size).toBeGreaterThan(20000);
  });

  it("every label name is in CosIng or explained", () => {
    const missing = [...allLabelNames()].filter(([n]) => !cosing.has(norm(n)) && !(n in EXCEPTIONS)).map(([n, from]) => `${from}: ${n}`);
    expect(missing).toEqual([]);
  });

  it("no stale exceptions", () => {
    const names = allLabelNames();
    const stale = Object.keys(EXCEPTIONS).filter((n) => !names.has(n) || cosing.has(norm(n)));
    expect(stale).toEqual([]);
  });
});
