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
