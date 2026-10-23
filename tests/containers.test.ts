import { describe, expect, it } from "vitest";
import { CONTAINERS, averyThatFit, findContainer, labelOptions, labelRoomSqIn } from "../lib/containers";

describe("container presets", () => {
  it("every container has a supplier source and unique key", () => {
    const keys = new Set<string>();
    for (const c of CONTAINERS) {
      expect(c.source.url).toMatch(/^https:\/\//);
      expect(keys.has(c.key)).toBe(false);
      keys.add(c.key);
      expect(labelOptions(c).length).toBeGreaterThan(0);
    }
  });

  it("4 oz straight-sided jar: 3 × 1.75 front and back, or a 7.25 × 1.75 wrap", () => {
    const opts = labelOptions(findContainer("jar-4oz")!);
    expect(opts.map((o) => o.text)).toEqual(["Front and back: 3 × 1.75 in each", "One wrap-around label: 7.25 × 1.75 in"]);
  });

  it("labels never go past the label band", () => {
    for (const c of CONTAINERS) {
      for (const o of labelOptions(c)) {
        if (o.placement === "front-back" || o.placement === "wrap") {
          expect(o.heightIn).toBeLessThanOrEqual(c.side!.heightIn);
          expect(o.widthIn).toBeLessThan(c.side!.aroundIn);
        }
        for (const a of o.avery) {
          const fits = (w: number, h: number) => w <= o.widthIn + 0.01 && h <= o.heightIn + 0.01;
          expect(fits(a.widthIn, a.heightIn) || fits(a.heightIn, a.widthIn)).toBe(true);
        }
      }
    }
  });

  it("a 3 × 2 label doesn't fit the side of a 2 oz jar", () => {
    for (const key of ["jar-2oz-thick", "jar-2oz-thin", "jar-2oz-double"]) {
      const fb = labelOptions(findContainer(key)!).find((o) => o.placement === "front-back")!;
      expect(fb.heightIn).toBeLessThan(2);
    }
  });

  it("tins get a lid label", () => {
    expect(labelOptions(findContainer("tin-2oz")!)).toEqual([expect.objectContaining({ placement: "lid", widthIn: 2.25 })]);
    expect(averyThatFit("round", 2.25, 2.25).map((t) => t.id)).toEqual(["22807"]);
  });

  it("small containers have under 12 sq in of side room", () => {
    expect(labelRoomSqIn(findContainer("boston-1oz")!)).toBeLessThan(12);
    expect(labelRoomSqIn(findContainer("boston-4oz")!)).toBeGreaterThan(12);
  });
});
