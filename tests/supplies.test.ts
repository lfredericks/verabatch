import { describe, expect, it } from "vitest";
import { cosmeticsPack } from "../lib/packs/cosmetics";
import { amountText, cleanSupplyPicks, costPerUnit, defaultLots, parseMoney, recognize, matchScore, readSupplyForm, suppliesForLine, supplyText, type Supply } from "../lib/supplies";

const fd = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
};
const sup = (o: Partial<Supply> & { id: string; ingredient: string }): Supply => ({
  supplier: "", supplier_lot: "", amount: "", unit: "", received_on: null, best_by: null, note: "", used_up: false, ...o,
});

describe("supplies", () => {
  it("reads a delivery from the form", () => {
    const r = readSupplyForm(fd({ ingredient: " Chamomile flower ", supplier: "Mountain Rose Herbs", supplier_lot: "XXXX-XXXX", amount: "2", unit: "lb", received_on: "2026-10-01" }), cosmeticsPack);
    expect("row" in r && r.row).toMatchObject({ ingredient: "Chamomile flower", supplier_lot: "XXXX-XXXX", amount: "2", unit: "lb", received_on: "2026-10-01", best_by: null });
    expect(readSupplyForm(fd({ ingredient: "" }), cosmeticsPack)).toEqual({ error: "Say what the ingredient is, like Chamomile flower." });
    expect(readSupplyForm(fd({ ingredient: "x", received_on: "2026-13-45" }), cosmeticsPack)).toHaveProperty("error");
  });

  it("records cost and works out cost per unit", () => {
    expect(parseMoney("$1,024.50")).toBe(1024.5);
    expect(parseMoney("")).toBeNull();
    expect(parseMoney("abc")).toBeNaN();
    expect(costPerUnit({ cost: 24.5, amount: "2", unit: "lb" })).toBe("$12.25/lb");
    expect(costPerUnit({ cost: 9, amount: "16", unit: "floz" })).toBe("$0.563/fl oz");
    expect(costPerUnit({ cost: null, amount: "2", unit: "lb" })).toBe("");
    const r = readSupplyForm(fd({ ingredient: "Jojoba oil", cost: "$18.99", amount: "16", unit: "floz" }), cosmeticsPack);
    expect("row" in r && r.row.cost).toBe(18.99);
    expect(readSupplyForm(fd({ ingredient: "Jojoba oil", cost: "lots" }), cosmeticsPack)).toEqual({ error: "Enter the cost in dollars, like 24.50." });
  });

  it("needs a description when the ingredient isn't recognized", () => {
    expect(recognize("Jojoba oil", null, cosmeticsPack).status).toBe("recognized");
    expect(recognize("Frobnitz blend #4", null, cosmeticsPack).status).toBe("unknown");
    expect(recognize("Frobnitz blend #4", { kind: "official", name: "Lavandula Angustifolia Oil" }, cosmeticsPack).status).toBe("official");
    expect(readSupplyForm(fd({ ingredient: "Frobnitz blend #4" }), cosmeticsPack)).toHaveProperty("error");
    const ok = readSupplyForm(fd({ ingredient: "Frobnitz blend #4", description: "Supplier's fragrance oil blend, skin-safe" }), cosmeticsPack);
    expect("row" in ok && ok.row.description).toBe("Supplier's fragrance oil blend, skin-safe");
  });

  it("describes a lot", () => {
    const s = sup({ id: "1", ingredient: "Chamomile flower", supplier: "Mountain Rose Herbs", supplier_lot: "XXXX-XXXX", amount: "2", unit: "lb" });
    expect(supplyText(s)).toBe("Chamomile flower · Mountain Rose Herbs · lot XXXX-XXXX");
    expect(amountText({ amount: "16", unit: "floz" })).toBe("16 fl oz");
  });

  it("matches lines to supplies on the words that matter", () => {
    expect(matchScore("chamomile infused oil", "Chamomile flower, dried")).toBe(1);
    expect(matchScore("jojoba oil", "Chamomile flower")).toBe(0);
    expect(matchScore("white beeswax pearls", "Beeswax pastilles")).toBe(1);
  });

  it("offers matching lots first, newest first, and hides used-up lots", () => {
    const list = [
      sup({ id: "a", ingredient: "Chamomile flower", supplier_lot: "AAAA-AAAA", received_on: "2026-01-05" }),
      sup({ id: "b", ingredient: "Chamomile flower", supplier_lot: "XXXX-XXXX", received_on: "2026-09-10" }),
      sup({ id: "c", ingredient: "Jojoba oil", received_on: "2026-08-01" }),
      sup({ id: "d", ingredient: "Chamomile flower", used_up: true, received_on: "2025-05-01" }),
    ];
    const r = suppliesForLine("1/4 cup chamomile infused jojoba", list);
    // Chamomile and jojoba both match this line; newest lot first.
    expect(r.matches.map((s) => s.id)).toEqual(["b", "c", "a"]);
    expect(suppliesForLine("chamomile flower", list).matches.map((s) => s.id)).toEqual(["b", "a"]);
    expect(r.matches.map((s) => s.id)).not.toContain("d");
    expect(suppliesForLine("chamomile", list, "d").matches.map((s) => s.id)).toContain("d");
  });

  it("keeps only real picks for real lines", () => {
    const known = new Set(["11111111-1111-1111-1111-111111111111"]);
    const a = "11111111-1111-1111-1111-111111111111";
    const m = cleanSupplyPicks({ 0: [a, a], 1: "22222222-2222-2222-2222-222222222222", 9: [a], x: "y" }, 3, known);
    expect([...m]).toEqual([[0, [a]]]);
  });

  it("starts an infused oil line with the newest herb lot and the newest oil lot", () => {
    const list = [
      sup({ id: "a", ingredient: "Chamomile flower", received_on: "2026-01-05" }),
      sup({ id: "b", ingredient: "Chamomile flower", received_on: "2026-09-10" }),
      sup({ id: "c", ingredient: "Jojoba oil", received_on: "2026-08-01" }),
      sup({ id: "e", ingredient: "Lavender essential oil", received_on: "2026-08-02" }),
    ];
    expect(defaultLots("chamomile infused jojoba oil", list)).toEqual(["b", "c"]);
    expect(defaultLots("10 drops lavender", list)).toEqual(["e"]);
    expect(defaultLots("beeswax", list)).toEqual([]);
  });
});
