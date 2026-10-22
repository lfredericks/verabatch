"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import type { ProductWarnings } from "@/lib/core";
import { activePack } from "@/lib/packs";
import { suggestedWarnings, warningLines } from "@/lib/warnings";
import { saveWarnings, type WarningsState } from "./actions";

const pack = activePack();
const OPTIONS = pack.warnings ?? [];
const GROUPS = [...new Set(OPTIONS.map((o) => o.group))];

/** Groups that fit this kind of product: a group is shown if any of its warnings is suggested for it. */
function groupsFor(typeKey: string): Set<string> {
  const fit = new Set(OPTIONS.filter((o) => o.suggestFor?.includes(typeKey)).map((o) => o.group));
  const type = pack.productTypes.find((t) => t.key === typeKey);
  // Body products may also need the FDA-required wording (bubble bath, aerosols).
  if (type?.use !== "home") fit.add(OPTIONS.find((o) => o.required)?.group ?? "");
  return fit;
}

/**
 * Warnings for the back label. Locked until Edit, like the other product details.
 * Standard statements are checkboxes (suggested ones marked for this kind of product),
 * plus up to five of the maker's own, one per line.
 */
export function Warnings({ productId, typeKey, warnings }: { productId: string; typeKey: string; warnings: ProductWarnings }) {
  const [editing, setEditing] = useState(false);
  const [keys, setKeys] = useState<Set<string>>(new Set(warnings.keys));
  const [custom, setCustom] = useState(warnings.custom.join("\n"));
  const [state, action, saving] = useActionState<WarningsState, FormData>(saveWarnings, {});
  const [showAll, setShowAll] = useState(false);
  const fits = groupsFor(typeKey);
  const shownGroups = GROUPS.filter((g) => showAll || fits.size === 0 || fits.has(g) || OPTIONS.some((o) => o.group === g && keys.has(o.key)));
  const suggested = new Set(suggestedWarnings(typeKey, pack));

  useEffect(() => {
    if (state.saved) setEditing(false);
  }, [state]);

  function open() {
    setKeys(new Set(warnings.keys));
    setCustom(warnings.custom.join("\n"));
    setEditing(true);
  }
  function toggle(key: string, on: boolean) {
    setKeys((s) => {
      const n = new Set(s);
      if (on) n.add(key);
      else n.delete(key);
      return n;
    });
  }

  const printed = warningLines(warnings, pack);

  if (!editing) {
    return (
      <section className="card" aria-labelledby="warnings">
        <h2 id="warnings">Warnings on the label</h2>
        {printed.length ? (
          <div className="lbl">
            {printed.map((l) => (
              <div key={l}>
                <b>{l}</b>
              </div>
            ))}
          </div>
        ) : (
          <p className="hint">
            None yet. {suggested.size > 0 ? "There are suggested warnings for this kind of product." : "Add any your product needs."}
          </p>
        )}
        {state.saved && (
          <p className="ok" role="status">
            Saved.
          </p>
        )}
        <button type="button" className="btn sm cta" onClick={open}>
          {printed.length ? "Edit warnings" : "Add warnings"}
        </button>
      </section>
    );
  }

  return (
    <form
      className="card form"
      aria-labelledby="warnings"
      onSubmit={(e) => {
        // React resets forms after an action; submit by hand so the boxes stay as ticked.
        e.preventDefault();
        const form = e.currentTarget;
        startTransition(() => action(new FormData(form)));
      }}
    >
      <h2 id="warnings">Warnings on the label</h2>
      <input type="hidden" name="id" value={productId} />
      {[...keys].map((k) => (
        <input key={k} type="hidden" name="key" value={k} />
      ))}
      {suggested.size > 0 && (
        <button type="button" className="btn sm cta" onClick={() => setKeys((s) => new Set([...s, ...suggested]))}>
          Tick the suggested ones
        </button>
      )}
      {shownGroups.map((g) => (
        <fieldset key={g} className="fld">
          <span>{g}</span>
          {OPTIONS.filter((o) => o.group === g).map((o) => (
            <div key={o.key} className="warn-opt">
              <label className="radio">
                <input type="checkbox" checked={keys.has(o.key)} onChange={(e) => toggle(o.key, e.target.checked)} />
                <span>
                  {o.short ?? o.text}
                  {suggested.has(o.key) && <span className="tag"> Suggested</span>}
                </span>
              </label>
              {o.note && <p className="hint">{o.note}</p>}
            </div>
          ))}
        </fieldset>
      ))}
      {shownGroups.length < GROUPS.length && (
        <button type="button" className="btn ghost sm cta" onClick={() => setShowAll(true)}>
          Show every warning
        </button>
      )}
      <label className="fld">
        <span>Your own warnings (one per line, up to five)</span>
        <textarea name="custom" rows={3} value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Store below 80°F." />
      </label>
      <p className="hint">Warnings print in bold on the back label, right after the ingredients, so they stand out as the FDA asks.</p>
      {state.error && (
        <p className="error" role="alert">
          {state.error}
        </p>
      )}
      <div className="row">
        <button className="btn pri" disabled={saving}>
          {saving ? "Saving..." : "Save warnings"}
        </button>
        <button type="button" className="btn ghost" onClick={() => setEditing(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}
