import { describe, expect, it } from "vitest";
import { cleanCounts, countsText, NO_SIZE, readBatchForm } from "../lib/batches";
import { lotNumber } from "../lib/core";
import { buildLabel } from "../lib/label";
import { cosmeticsPack } from "../lib/packs/cosmetics";

const business = { name: "Liminalia", cityStateZip: "Anderson, IN 46016", contact: "liminalia.co" };
const product = {
  name: "Relief Balm", type_key: "salve", identity: "Botanical Skin Balm", makes: 5,
  recipe: [
    { amount: "1/2", unit: "cup" as const, text: "jojoba oil" },
    { amount: "1/4", unit: "cup" as const, text: "white beeswax pearls" },
  ],
};

describe("batches are optional", () => {
  it("label without a batch has no lot line", () => {
    const l = buildLabel({ product, business, size: null, pack: cosmeticsPack });
    expect(l.back.some((b) => b.startsWith("Lot "))).toBe(false);
    expect(l.blockers).toEqual([]);
  });

  it("a batch label uses the batch's own recipe and shows its lot", () => {
    const l = buildLabel({
      product, business, size: null, pack: cosmeticsPack,
      batch: { lot: "RB-261020-1", recipe: [...product.recipe, { amount: "1", unit: "tbsp", text: "vitamin e oil" }] },
    });
    expect(l.back[l.back.length - 1]).toBe("Lot RB-261020-1");
    expect(l.ingredients).toContain("Tocopherol");
  });

  it("Relief Balm lots on Oct 20, 2026", () => {
    expect(lotNumber("Relief Balm", "2026-10-20", [])).toBe("RB-261020-1");
    expect(lotNumber("Relief Balm", "2026-10-20", ["RB-261020-1"])).toBe("RB-261020-2");
  });
});

describe("batch form", () => {
  const fd = (o: Record<string, string>) => {
    const f = new FormData();
    for (const [k, v] of Object.entries(o)) f.set(k, v);
    return f;
  };
  it("keeps counts only for this product's sizes, whole numbers above zero", () => {
    expect(cleanCounts({ a: "5", b: 0, c: "x", zzz: 3 }, ["a", "b", "c"])).toEqual({ a: 5 });
  });
  it("products without sizes count under one key", () => {
    const b = readBatchForm(fd({ made_on: "2026-10-20", counts: JSON.stringify({ [NO_SIZE]: "5" }) }), []);
    expect(b.error).toBeUndefined();
    expect(b.counts).toEqual({ [NO_SIZE]: 5 });
    expect(countsText(b.counts, {})).toBe("5 made");
  });
  it("needs a date, and a recipe if something changed", () => {
    expect(readBatchForm(fd({ made_on: "" }), []).error).toBeTruthy();
    expect(readBatchForm(fd({ made_on: "2026-10-20", changed: "1", recipe: "[]" }), []).error).toBeTruthy();
  });
});
