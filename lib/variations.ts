import type { RecipeLine } from "./core/types";

/**
 * Variations store only how they differ from the parent recipe, by line key:
 *   remove   - the parent's line is left out ("no mugwort")
 *   replace  - the parent's line is swapped for another ("rosemary instead of chamomile",
 *              or the same ingredient in a different amount)
 *   add      - a line the parent doesn't have
 * Lines the variation didn't touch follow the parent when the parent changes.
 */
export type Change =
  | { op: "remove"; key: string }
  | { op: "replace"; key: string; line: RecipeLine }
  | { op: "add"; line: RecipeLine };

/** Short random id for a recipe line. */
export function newKey(): string {
  return Math.random().toString(36).slice(2, 10).padEnd(8, "0");
}

/**
 * Give every line a key. Lines saved before keys existed get "k<position>", which is
 * the same on the server and in the browser as long as both read the same stored list.
 */
export function ensureKeys(lines: RecipeLine[]): RecipeLine[] {
  return lines.map((l, i) => (l.key ? l : { ...l, key: `k${i}` }));
}

function sameLine(a: RecipeLine, b: RecipeLine): boolean {
  const v = (l: RecipeLine) => JSON.stringify([l.variety ?? null, l.pick ?? null]);
  return a.amount.trim() === b.amount.trim() && a.unit === b.unit && a.text.trim() === b.text.trim() && v(a) === v(b);
}

/** Apply a variation's changes to the parent recipe. */
export function resolveRecipe(parent: RecipeLine[], changes: Change[]): RecipeLine[] {
  const base = ensureKeys(parent);
  const keys = new Set(base.map((l) => l.key));
  const removed = new Set(changes.filter((c) => c.op === "remove").map((c) => c.key));
  const replaced = new Map(changes.filter((c): c is Extract<Change, { op: "replace" }> => c.op === "replace").map((c) => [c.key, c.line]));
  const out: RecipeLine[] = [];
  for (const l of base) {
    if (removed.has(l.key!)) continue;
    const r = replaced.get(l.key!);
    out.push(r ? { ...r, key: l.key! } : l);
  }
  // A swap whose parent line has since been deleted stays in, so an ingredient the
  // variation deliberately has is never dropped silently.
  for (const [key, line] of replaced) if (!keys.has(key)) out.push({ ...line, key });
  for (const c of changes) if (c.op === "add") out.push(c.line);
  return out;
}

/** Work out a variation's changes from the parent recipe and the variation as edited. */
export function diffRecipe(parent: RecipeLine[], edited: RecipeLine[]): Change[] {
  const base = ensureKeys(parent);
  const byKey = new Map(base.map((l) => [l.key!, l]));
  const seen = new Set<string>();
  const changes: Change[] = [];
  for (const l of edited) {
    const p = l.key ? byKey.get(l.key) : undefined;
    if (p && !seen.has(l.key!)) {
      seen.add(l.key!);
      if (!sameLine(p, l)) changes.push({ op: "replace", key: l.key!, line: l });
    } else {
      changes.push({ op: "add", line: { ...l, key: l.key && !byKey.has(l.key) ? l.key : newKey() } });
    }
  }
  for (const p of base) if (!seen.has(p.key!)) changes.push({ op: "remove", key: p.key! });
  return changes;
}

/** True if two recipes differ in any line (amount, unit, ingredient, answer) or in order. */
export function recipesDiffer(a: RecipeLine[], b: RecipeLine[]): boolean {
  const clean = (ls: RecipeLine[]) => ls.filter((l) => l.text.trim() || l.amount.trim());
  const x = clean(a);
  const y = clean(b);
  return x.length !== y.length || x.some((l, i) => !sameLine(l, y[i]!));
}

/** Per line of a variation: is it from the parent, changed, or added? Plus removed parent lines. */
export function compareToParent(parent: RecipeLine[], lines: RecipeLine[]) {
  const base = ensureKeys(parent);
  const byKey = new Map(base.map((l) => [l.key!, l]));
  const status = lines.map((l) => {
    const p = l.key ? byKey.get(l.key) : undefined;
    return !p ? "added" : sameLine(p, l) ? "same" : "changed";
  });
  const present = new Set(lines.map((l) => l.key));
  const removed = base.filter((p) => !present.has(p.key));
  return { status, removed };
}

/** Tidy changes sent from anywhere. Invalid entries are dropped. */
export function cleanChanges(input: unknown, cleanLine: (l: unknown) => RecipeLine | null): Change[] {
  if (!Array.isArray(input)) return [];
  const out: Change[] = [];
  for (const c of input.slice(0, 200)) {
    if (!c || typeof c !== "object") continue;
    const o = c as Record<string, unknown>;
    const key = typeof o.key === "string" && /^[a-z0-9]{1,12}$/.test(o.key) ? o.key : null;
    if (o.op === "remove" && key) out.push({ op: "remove", key });
    else if (o.op === "replace" && key) {
      const line = cleanLine(o.line);
      if (line) out.push({ op: "replace", key, line });
    } else if (o.op === "add") {
      const line = cleanLine(o.line);
      if (line) out.push({ op: "add", line });
    }
  }
  return out;
}
