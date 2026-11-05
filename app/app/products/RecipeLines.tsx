"use client";

import { useMemo, useState, type ReactNode } from "react";
import { computeRecipe, parseQuickEntry, UNIT_LABELS, type NamePick, type RecipeLine, type Resolution, type Unit } from "@/lib/core";
import { activePack } from "@/lib/packs";
import { compareToParent } from "@/lib/variations";
import { NameFinder } from "./NameFinder";

export type Row = RecipeLine & { id: number };
type Question = Extract<Resolution, { status: "needsChoice" }>;

const pack = activePack();

/** Unit menu, with weight and liquid ounces told apart. */
const UNIT_OPTIONS: { key: Unit; label: string }[] = (Object.keys(UNIT_LABELS) as Unit[]).map((u) => ({
  key: u,
  label: u === "oz" ? "oz (weight)" : u === "floz" ? "fl oz (liquid)" : UNIT_LABELS[u],
}));

let nextId = 1;
export const toRows = (lines: RecipeLine[]): Row[] => lines.map((l) => ({ ...l, id: nextId++ }));
export const blankRow = (): Row => ({ id: nextId++, amount: "", unit: "oz", text: "" });
export const rowsToLines = (rows: Row[]): RecipeLine[] => rows.map(({ id: _id, ...l }) => l);

function amountText(r: RecipeLine): string {
  if (!r.amount) return "—";
  return `${r.amount} ${UNIT_LABELS[r.unit]}`;
}

/**
 * The recipe as a list. Saved lines are locked: each has its own Edit button, so
 * an amount can't change by a stray tap. New lines open ready to type.
 */
export function RecipeLines({
  rows,
  setRows,
  onChange,
  startOpen,
  onMakes,
  parent,
}: {
  rows: Row[];
  setRows: (fn: (rows: Row[]) => Row[]) => void;
  onChange: () => void;
  /** Open every line for typing (a brand-new recipe). */
  startOpen: boolean;
  /** "makes 5" in a pasted recipe. */
  onMakes?: (n: number) => void;
  /** For a variation: the parent's recipe, to mark what differs. */
  parent?: { name: string; lines: RecipeLine[] } | null;
}) {
  const [open, setOpen] = useState<Set<number>>(() => new Set(startOpen ? rows.map((r) => r.id) : []));
  const [paste, setPaste] = useState("");
  /** Lines where the maker chose "Mine isn't listed" on a which-one question. */
  const [finding, setFinding] = useState<Set<number>>(() => new Set());
  const [pasteOpen, setPasteOpen] = useState(false);
  /** A new recipe starts on the paste box; "type it line by line" leaves it. */
  const [manual, setManual] = useState(false);

  const lines = useMemo(() => rowsToLines(rows), [rows]);
  const recipe = useMemo(() => computeRecipe(lines, pack), [lines]);
  const byLine = new Map(recipe.lines.map((c) => [c.line, c]));
  const vs = parent ? compareToParent(parent.lines, lines) : null;

  const toggle = (id: number, on: boolean) =>
    setOpen((s) => {
      const n = new Set(s);
      if (on) n.add(id);
      else n.delete(id);
      return n;
    });

  function update(id: number, patch: Partial<RecipeLine>) {
    setRows((rs) =>
      rs.map((r) => {
        if (r.id !== id) return r;
        const next = { ...r, ...patch };
        // A different ingredient needs its name picked again.
        if (patch.text !== undefined && patch.text !== r.text) delete next.pick;
        return next;
      }),
    );
    onChange();
  }
  function answer(row: Row, q: Question, key: string) {
    const prior = row.variety?.group === q.group ? row.variety : undefined;
    update(row.id, { variety: { ...q.known, ...prior, group: q.group, [q.missing]: key } });
  }
  /** Forget "which one" answers and picked names (keeps the line's key for variations). */
  function clearAnswer(row: Row) {
    setRows((rs) => rs.map((r) => (r.id === row.id ? { id: r.id, amount: r.amount, unit: r.unit, text: r.text, ...(r.key ? { key: r.key } : {}), ...(r.organic ? { organic: true } : {}) } : r)));
    onChange();
  }
  function pickName(row: Row, pick: NamePick) {
    setRows((rs) =>
      rs.map((r) => (r.id === row.id ? { id: r.id, amount: r.amount, unit: r.unit, text: r.text, ...(r.key ? { key: r.key } : {}), ...(r.organic ? { organic: true } : {}), pick } : r)),
    );
    setFinding((s) => {
      const n = new Set(s);
      n.delete(row.id);
      return n;
    });
    onChange();
  }
  function startFinding(row: Row, on: boolean) {
    setFinding((s) => {
      const n = new Set(s);
      if (on) n.add(row.id);
      else n.delete(row.id);
      return n;
    });
  }
  function addLine() {
    const b = blankRow();
    setRows((rs) => [...rs, b]);
    toggle(b.id, true);
    onChange();
  }
  function addPasted() {
    const parsed = parseQuickEntry(paste);
    if (parsed.lines.length) setRows((rs) => [...rs.filter((r) => r.text.trim() || r.amount.trim()), ...toRows(parsed.lines)]);
    if (parsed.makes && onMakes) onMakes(parsed.makes);
    setPaste("");
    setPasteOpen(false);
    onChange();
  }

  const hasLines = rows.some((r) => r.text.trim() || r.amount.trim());
  const showPaste = pasteOpen || (startOpen && !hasLines && !manual);

  return (
    <>
      {showPaste ? (
        <div className="paste-box">
          <label className="fld">
            <span>Paste or type your recipe, one ingredient per line. Any units.</span>
            <textarea
              rows={6}
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              placeholder={"1/2 cup jojoba oil\n1/4 cup shea butter\n20 drops lavender essential oil\nmakes 5"}
            />
          </label>
          <div className="row">
            <button type="button" className="btn sm" onClick={addPasted} disabled={!paste.trim()}>
              Add these lines
            </button>
            {hasLines && (
              <button type="button" className="btn ghost sm" onClick={() => (setPaste(""), setPasteOpen(false))}>
                Cancel
              </button>
            )}
            {!hasLines && (
              <button type="button" className="btn ghost sm" onClick={() => (setPasteOpen(false), setManual(true))}>
                Type it line by line instead
              </button>
            )}
          </div>
        </div>
      ) : (
        <button type="button" className="paste-btn" onClick={() => setPasteOpen(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="8" y="4" width="12" height="16" rx="2" />
            <path d="M4 8v12a2 2 0 002 2h10" />
          </svg>
          Paste a recipe, any units
        </button>
      )}

      {!showPaste && rows.length > 0 && (
      <ul className="rlist">
        {rows.map((row, i) => {
          const r = byLine.get(lines[i]!)?.resolution;
          const editing = open.has(row.id);
          const mark = vs?.status[i];
          const asking = r?.status === "needsChoice" && !finding.has(row.id);
          const cls = ["rline", mark && mark !== "same" ? "rline-diff" : "", asking || r?.status === "unknown" ? "rline-ask" : ""].filter(Boolean).join(" ");

          // The official name line under the ingredient.
          let status: ReactNode = null;
          let common: ReactNode = null;
          if (r?.status === "known" && r.pick === "custom") {
            status = (
              <span className="rstatus warn-text">
                {r.labelName}: your own name, <b>not an official ingredient name</b>
              </span>
            );
          } else if (r?.status === "known") {
            const names = r.parts ? r.parts.map((p) => p.labelName) : [r.labelName];
            const printed = names.map((n) => pack.printName?.(n, row.common) ?? { text: n, needsCommon: false });
            const missing = printed.some((p) => p.needsCommon);
            status = <span className={`rstatus ${missing ? "warn-text" : "ok-text"}`}>{printed.map((p) => p.text).join(", ")}</span>;
            if (missing || (editing && row.common !== undefined))
              common = (
                <label className="fld">
                  <span>Everyday name for customers (required on US labels)</span>
                  <input
                    value={row.common ?? ""}
                    // Typing opens the line, so the box stays put until Done.
                    onChange={(e) => (update(row.id, { common: e.target.value }), toggle(row.id, true))}
                    placeholder="Mugwort"
                    maxLength={60}
                  />
                </label>
              );
          } else if (r?.status === "unknown" && row.text.trim()) {
            status = <span className="rstatus warn-text">Not in our ingredient list yet</span>;
          } else if (r?.status === "needsChoice") {
            status = <span className="rstatus warn-text">{r.question} Check your bottle.</span>;
          }

          const choices = r?.status === "needsChoice" ? pack.choices?.(r) ?? [] : [];

          return (
            <li className={cls} key={row.id}>
              {mark === "changed" && <p className="tag">Changed from {parent!.name}</p>}
              {mark === "added" && <p className="tag">Added in this variation</p>}
              {editing ? (
                <div className="rinputs">
                  <input
                    aria-label="Amount"
                    className="amt"
                    inputMode="decimal"
                    value={row.amount}
                    onChange={(e) => update(row.id, { amount: e.target.value })}
                    placeholder="1/2"
                    maxLength={20}
                    autoFocus={!row.text}
                  />
                  <select aria-label="Unit" value={row.unit} onChange={(e) => update(row.id, { unit: e.target.value as Unit })}>
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u.key} value={u.key}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                  <input
                    aria-label="Ingredient"
                    className="ing"
                    value={row.text}
                    onChange={(e) => update(row.id, { text: e.target.value })}
                    placeholder="Ingredient"
                    maxLength={160}
                  />
                  <button type="button" className="btn sm" onClick={() => toggle(row.id, false)}>
                    Done
                  </button>
                </div>
              ) : (
                <button type="button" className="rread" onClick={() => toggle(row.id, true)} aria-label={`Edit ${row.text || "line"}`}>
                  <span className="amt">{amountText(row)}</span>
                  <span className="ing">
                    <span className="ing-name">
                      {row.text || <i className="hint">blank line</i>}
                      {row.organic && <span className="org-tag">Organic</span>}
                    </span>
                    {status}
                  </span>
                </button>
              )}
              {editing && status && <p className="rstatus-edit">{status}</p>}
              {common}

              {r?.status === "unknown" && row.text.trim() && <NameFinder typed={row.text} onPick={(p) => pickName(row, p)} />}
              {r?.status === "needsChoice" &&
                (finding.has(row.id) ? (
                  <NameFinder typed={row.text} onPick={(p) => pickName(row, p)} onCancel={() => startFinding(row, false)} />
                ) : choices.length <= 4 ? (
                  <div className="answers" role="group" aria-label={r.question}>
                    {choices.map((ch) => {
                      const m = /^(.*?)\s*\((.*)\)$/.exec(ch.label);
                      return (
                        <button key={ch.key} type="button" className="answer" onClick={() => answer(row, r, ch.key)}>
                          <b>{m ? m[1] : ch.label}</b>
                          {m && <span>{m[2]}</span>}
                        </button>
                      );
                    })}
                    <button type="button" className="btn ghost sm" onClick={() => startFinding(row, true)}>
                      Mine isn&rsquo;t listed
                    </button>
                    {r.note && <p className="hint">{r.note}</p>}
                  </div>
                ) : (
                  <div className="answers">
                    <select
                      aria-label={r.question}
                      value=""
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "__mine") startFinding(row, true);
                        else if (v) answer(row, r, v);
                      }}
                    >
                      <option value="">Choose (check your bottle)</option>
                      {choices.map((ch) => (
                        <option key={ch.key} value={ch.key}>
                          {ch.label}
                        </option>
                      ))}
                      <option value="__mine">Mine isn&rsquo;t listed</option>
                    </select>
                    {r.note && <p className="hint">{r.note}</p>}
                  </div>
                ))}
              {editing && row.text.trim() && (
                <label className="radio">
                  <input type="checkbox" checked={Boolean(row.organic)} onChange={(e) => update(row.id, { organic: e.target.checked || undefined })} />
                  <span>Certified organic (your supplier certifies it)</span>
                </label>
              )}
              {editing && (
                <div className="row">
                  {(row.variety || row.pick) && (
                    <button type="button" className="btn ghost sm" onClick={() => clearAnswer(row)}>
                      {row.pick ? "Change the name" : "Change which one"}
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn ghost sm"
                    onClick={() => (setRows((rs) => rs.filter((x) => x.id !== row.id)), onChange())}
                  >
                    Remove this line
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      )}

      {vs && vs.removed.length > 0 && (
        <div className="removed">
          <p className="hint">Left out from {parent!.name}:</p>
          {vs.removed.map((l) => (
            <div key={l.key} className="rremoved">
              <span className="amt">{amountText(l)}</span>
              <s className="ing">{l.text}</s>
              <button
                type="button"
                className="btn ghost sm"
                onClick={() => (setRows((rs) => [...rs, ...toRows([l])]), onChange())}
              >
                Put back
              </button>
            </div>
          ))}
        </div>
      )}

      {!showPaste && (
        <button type="button" className="add-line" onClick={addLine}>
          + Add an ingredient
        </button>
      )}
    </>
  );
}
