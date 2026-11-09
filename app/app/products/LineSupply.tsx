"use client";

import { useState, useTransition } from "react";
import type { SupplyChoice } from "@/lib/lineLinks";
import { matchMaterials } from "@/lib/materials";
import { linkLine, newSupplyForLine } from "./lineLinkActions";

/**
 * Under a recipe line, after "Which lavender?": "Which one of yours is it?" Lists your
 * matching supplies with their shops and what's left, plus "+ Add a new one" and "Don't link".
 * One match shows quietly. Saves on tap; never part of the recipe save.
 */
export function LineSupply({
  productId,
  lineKey,
  lineText,
  choices,
  value,
  onChange,
  editing,
}: {
  productId: string;
  lineKey: string;
  lineText: string;
  choices: SupplyChoice[];
  /** A supply id, null = don't link, undefined = not decided. */
  value: string | null | undefined;
  onChange: (v: string | null | undefined, added?: SupplyChoice) => void;
  editing: boolean;
}) {
  const [choosing, setChoosing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [failed, setFailed] = useState(false);
  const [busy, start] = useTransition();
  const matches = matchMaterials(lineText, choices);
  const linked = value ? choices.find((c) => c.id === value) : undefined;
  const quiet = value === undefined && matches.length === 1 ? matches[0] : undefined;
  const asking = choosing || (value === undefined && matches.length > 1);

  function save(v: string | null | "") {
    setFailed(false);
    start(async () => {
      const r = await linkLine(productId, lineKey, v);
      if (!r.ok) return setFailed(true);
      onChange(v === "" ? undefined : v);
      setChoosing(false);
    });
  }
  function add() {
    const name = newName.trim();
    if (!name) return;
    setFailed(false);
    start(async () => {
      const m = await newSupplyForLine(productId, lineKey, name);
      if (!m) return setFailed(true);
      onChange(m.id, { id: m.id, name: m.name, detail: "" });
      setAdding(false);
      setChoosing(false);
    });
  }

  if (!asking) {
    const shown = linked ?? quiet;
    if (shown)
      return (
        <p className="rsupply">
          From your supplies: <b>{shown.name}</b>
          {shown.detail && <span> · {shown.detail}</span>}{" "}
          <button type="button" className="linkbtn" onClick={() => setChoosing(true)}>
            Change
          </button>
        </p>
      );
    if (!editing || !choices.length) return null;
    return (
      <p className="rsupply">
        {value === null ? "Not linked to your supplies." : "Not in your supplies."}{" "}
        <button type="button" className="linkbtn" onClick={() => setChoosing(true)}>
          {value === null ? "Link it" : "Pick or add it"}
        </button>
      </p>
    );
  }

  const others = choices.filter((c) => !matches.includes(c));
  return (
    <div className="answers line-supply" role="group" aria-label="Which one of yours is it?">
      <p className="step-q-sm">Which one of yours is it?</p>
      {matches.map((c) => (
        <button key={c.id} type="button" className="answer" aria-pressed={value === c.id} disabled={busy} onClick={() => save(c.id)}>
          <b>{c.name}</b>
          {c.detail && <span>{c.detail}</span>}
        </button>
      ))}
      {others.length > 0 && (
        <select aria-label="Something else from your supplies" value="" disabled={busy} onChange={(e) => e.target.value && save(e.target.value)}>
          <option value="">{matches.length ? "Something else" : "Pick from your supplies"}</option>
          {others.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.detail ? ` (${c.detail})` : ""}
            </option>
          ))}
        </select>
      )}
      {adding ? (
        <div className="pair">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={120} placeholder="What you call it" aria-label="New supply name" autoFocus />
          <button type="button" className="btn sm" disabled={busy || !newName.trim()} onClick={add}>
            Add
          </button>
        </div>
      ) : (
        <button type="button" className="btn ghost sm" onClick={() => (setAdding(true), setNewName(lineText.replace(/^\s*[\d./\s]+(drops?|tsp|tbsp|cups?|oz|g)?\s+/i, "")))}>
          + Add a new one
        </button>
      )}
      <div className="row">
        <button type="button" className="btn ghost sm" disabled={busy} onClick={() => save(null)}>
          Don&rsquo;t link
        </button>
        {choosing && (
          <button type="button" className="btn ghost sm" onClick={() => (setChoosing(false), setAdding(false))}>
            Cancel
          </button>
        )}
      </div>
      {failed && (
        <p className="error" role="alert">
          That didn&rsquo;t save. Try again in a moment.
        </p>
      )}
    </div>
  );
}
