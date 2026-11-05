import { describe, expect, it } from "vitest";
import { PICK_TABS, pickTabsFor, picksFor } from "../lib/containers";

describe("container picker order by product kind", () => {
  it("sprays and mists start on bottles", () => {
    expect(pickTabsFor("room")[0]).toBe("Bottles");
    expect(pickTabsFor("mist")[0]).toBe("Bottles");
  });
  it("candles start on candles, lip balm on tubes, butter on jars", () => {
    expect(pickTabsFor("candle")[0]).toBe("Candles");
    expect(pickTabsFor("balm")[0]).toBe("Tubes");
    expect(pickTabsFor("butter")[0]).toBe("Jars");
  });
  it("every tab is still there, once", () => {
    for (const k of ["room", "candle", "balm", "soap", "other", null]) {
      expect([...pickTabsFor(k)].sort()).toEqual([...PICK_TABS].sort());
    }
  });
  it("face oils show droppers first", () => {
    expect(picksFor("Bottles", "face")[0]!.look).toBe("dropper");
    expect(picksFor("Bottles", "room")[0]!.look).toBe("bottle");
  });
});
