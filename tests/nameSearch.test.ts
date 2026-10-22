import { describe, expect, it } from "vitest";
import { suggestNames, titleCaseInci } from "../lib/packs/cosmetics/nameSearch";

describe("ingredient name suggestions", () => {
  it("common name to official name: mugwort", () => {
    const s = suggestNames("mugwort");
    expect(s.length).toBeGreaterThan(0);
    expect(s.slice(0, 3).every((n) => n.startsWith("Artemisia Vulgaris"))).toBe(true);
    expect(s.some((n) => n.includes("/"))).toBe(false);
  });
  it("form words rank matching names first", () => {
    expect(suggestNames("mugwort oil")[0]).toMatch(/Oil$/);
    expect(suggestNames("infused mugwort")[0]).toMatch(/Extract$/);
  });
  it("Latin typed directly works", () => {
    expect(suggestNames("calendula officinalis")[0]).toMatch(/^Calendula Officinalis/);
  });
  it("nonsense gives nothing", () => {
    expect(suggestNames("lavender blue zzz")).toEqual([]);
    expect(suggestNames("x")).toEqual([]);
  });
  it("title case keeps slashes and hyphens readable", () => {
    expect(titleCaseInci("EUCALYPTUS RADIATA LEAF/STEM OIL")).toBe("Eucalyptus Radiata Leaf/Stem Oil");
  });
});
