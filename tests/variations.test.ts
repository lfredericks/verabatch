import { describe, expect, it } from "vitest";
import type { RecipeLine } from "../lib/core";
import { cleanLine } from "../lib/products";
import { cleanChanges, compareToParent, diffRecipe, ensureKeys, recipesDiffer, resolveRecipe } from "../lib/variations";

// Comfort Blend and Comfort Blend II from Leslie's sheet.
const comfort: RecipeLine[] = ensureKeys([
  { amount: "2", unit: "floz", text: "witch hazel" },
  { amount: "2", unit: "floz", text: "distilled water" },
  { amount: "8", unit: "drop", text: "sandalwood" },
  { amount: "13", unit: "drop", text: "frankincense" },
  { amount: "8", unit: "drop", text: "roman chamomile" },
  { amount: "5", unit: "drop", text: "bergamot" },
  { amount: "2", unit: "drop", text: "clove" },
]);

describe("variations", () => {
  it("Comfort Blend II = Comfort Blend with rosemary instead of chamomile", () => {
    const edited = comfort.map((l) => (l.text === "roman chamomile" ? { ...l, text: "rosemary" } : l));
    const changes = diffRecipe(comfort, edited);
    expect(changes).toEqual([{ op: "replace", key: "k4", line: { amount: "8", unit: "drop", text: "rosemary", key: "k4" } }]);
    expect(resolveRecipe(comfort, changes).map((l) => l.text)).toEqual(edited.map((l) => l.text));
  });

  it("follows the parent where it didn't change", () => {
    const changes = diffRecipe(comfort, comfort.map((l) => (l.text === "roman chamomile" ? { ...l, text: "rosemary" } : l)));
    const parentNow = comfort.map((l) => (l.text === "frankincense" ? { ...l, amount: "10" } : l));
    const v = resolveRecipe(parentNow, changes);
    expect(v.find((l) => l.text === "frankincense")!.amount).toBe("10");
    expect(v.some((l) => l.text === "roman chamomile")).toBe(false);
  });

  it("a removal ('coconut-free') and an addition", () => {
    const edited = [...comfort.filter((l) => l.text !== "clove"), { amount: "3", unit: "drop" as const, text: "mugwort" }];
    const changes = diffRecipe(comfort, edited);
    expect(changes.filter((c) => c.op === "remove")).toEqual([{ op: "remove", key: "k6" }]);
    expect(changes.filter((c) => c.op === "add")).toHaveLength(1);
    const v = resolveRecipe(comfort, changes);
    expect(v.map((l) => l.text)).toEqual([...comfort.filter((l) => l.text !== "clove").map((l) => l.text), "mugwort"]);
  });

  it("a swap whose parent line was later deleted stays in", () => {
    const changes = diffRecipe(comfort, comfort.map((l) => (l.key === "k4" ? { ...l, text: "rosemary" } : l)));
    const parentNow = comfort.filter((l) => l.key !== "k4");
    expect(resolveRecipe(parentNow, changes).some((l) => l.text === "rosemary")).toBe(true);
  });

  it("no edits, no changes", () => {
    expect(diffRecipe(comfort, comfort)).toEqual([]);
    expect(recipesDiffer(comfort, comfort)).toBe(false);
    expect(recipesDiffer(comfort, comfort.slice(1))).toBe(true);
  });

  it("marks lines for the variation editor", () => {
    const edited = [...comfort.filter((l) => l.text !== "clove").map((l) => (l.key === "k0" ? { ...l, amount: "3" } : l)), { amount: "1", unit: "drop" as const, text: "mugwort" }];
    const { status, removed } = compareToParent(comfort, edited);
    expect(status[0]).toBe("changed");
    expect(status[1]).toBe("same");
    expect(status[status.length - 1]).toBe("added");
    expect(removed.map((l) => l.text)).toEqual(["clove"]);
  });

  it("cleanChanges drops junk", () => {
    expect(cleanChanges([{ op: "remove", key: "k1" }, { op: "remove", key: "BAD KEY" }, { op: "nope" }, { op: "add", line: { amount: "1", unit: "g", text: "x" } }], cleanLine)).toEqual([
      { op: "remove", key: "k1" },
      { op: "add", line: { amount: "1", unit: "g", text: "x" } },
    ]);
  });
});
