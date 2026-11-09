import { describe, expect, it } from "vitest";
import { allocate, inSupplyUnit, onHand, remaining } from "../lib/materials";

describe("materials and deliveries", () => {
  it("turns a recipe line's grams or mL into the delivery's unit", () => {
    expect(inSupplyUnit({ grams: 453.592, ml: 500 }, "lb")).toBeCloseTo(1);
    expect(inSupplyUnit({ grams: 100, ml: 29.5735 }, "floz")).toBeCloseTo(1);
    expect(inSupplyUnit({ grams: 100, ml: 100 }, "each")).toBeNull();
    expect(inSupplyUnit({ grams: 100, ml: 100 }, "")).toBeNull();
  });

  it("works out what's left of a delivery", () => {
    expect(remaining({ amount: "5", unit: "lb" }, [1, 0.5])).toBeCloseTo(3.5);
    expect(remaining({ amount: "1 1/2", unit: "lb" }, [2])).toBe(0);
    expect(remaining({ amount: "", unit: "" }, [])).toBeNull();
  });

  it("takes from the oldest delivery first, then the next", () => {
    const out = allocate(1, [
      { id: "old", left: 0.25 },
      { id: "new", left: 2 },
    ]);
    expect(out).toEqual([
      { id: "old", amount: 0.25 },
      { id: "new", amount: 0.75 },
    ]);
    // Not enough logged: the last one takes the rest (the maker had more than they logged).
    expect(allocate(3, [{ id: "a", left: 1 }])).toEqual([{ id: "a", amount: 3 }]);
    // Unknown amounts on hand: split evenly.
    expect(allocate(1, [{ id: "a", left: null }, { id: "b", left: null }])).toEqual([
      { id: "a", amount: 0.5 },
      { id: "b", amount: 0.5 },
    ]);
  });

  it("adds up what's on hand across deliveries in one unit", () => {
    expect(onHand([{ left: 0.5, unit: "lb" }, { left: 16, unit: "oz" }])).toEqual({ amount: 1.5, unit: "lb" });
    expect(onHand([{ left: 100, unit: "ml" }, { left: 1, unit: "floz" }])?.unit).toBe("ml");
    expect(onHand([{ left: null, unit: "lb" }])).toBeNull();
    // Weight and volume can't be added together: no single total.
    expect(onHand([{ left: 1, unit: "lb" }, { left: 4, unit: "floz" }])).toBeNull();
  });
});

import { matchMaterials } from "../lib/materials";
import { defaultLots, suppliesForLine, type Supply } from "../lib/supplies";

describe("recipe line to one of your supplies", () => {
  const mats = [
    { id: "a", name: "Lavender essential oil" },
    { id: "b", name: "Lavender buds" },
    { id: "c", name: "Unrefined shea" },
  ];
  it("finds supplies by name, ignoring words like oil and butter", () => {
    expect(matchMaterials("20 drops lavender", mats).map((m) => m.id)).toEqual(["a", "b"]);
    expect(matchMaterials("shea butter", mats).map((m) => m.id)).toEqual(["c"]);
    expect(matchMaterials("jojoba oil", mats)).toEqual([]);
  });

  const d = (id: string, material_id: string, ingredient: string, received_on: string): Supply & { material_id: string } => ({
    id, material_id, ingredient, received_on, supplier: "", supplier_lot: "", amount: "", unit: "", best_by: null, note: "", used_up: false,
  });
  const deliveries = [d("1", "a", "Lavender essential oil", "2026-03-01"), d("2", "b", "Lavender buds", "2026-01-01"), d("3", "a", "Lavender essential oil", "2026-02-01")];

  it("a linked line only offers that supply's deliveries, oldest first", () => {
    expect(suppliesForLine("lavender", deliveries, undefined, "a").matches.map((x) => x.id)).toEqual(["3", "1"]);
    expect(defaultLots("lavender", deliveries, "a")).toEqual(["3"]);
  });
  it("a line set to don't link offers nothing up front", () => {
    expect(suppliesForLine("lavender", deliveries, undefined, null).matches).toEqual([]);
    expect(defaultLots("lavender", deliveries, null)).toEqual([]);
  });
});
