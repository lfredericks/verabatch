"use client";

import { useEffect, useState } from "react";
import type { NamePick } from "@/lib/core";

/**
 * "Did you mean...?" for an ingredient name: official names that match what was typed,
 * or the maker's own name (flagged on the label as not official).
 */
export function NameFinder({ typed, onPick, onCancel }: { typed: string; onPick: (p: NamePick) => void; onCancel?: () => void }) {
  const [names, setNames] = useState<string[] | null>(null);
  const [own, setOwn] = useState(typed);
  const [ownOpen, setOwnOpen] = useState(false);

  useEffect(() => {
    let live = true;
    setNames(null);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/ingredients?q=${encodeURIComponent(typed)}`);
        const j = (await r.json()) as { names?: string[] };
        if (live) setNames(j.names ?? []);
      } catch {
        if (live) setNames([]);
      }
    }, 350);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [typed]);

  return (
    <div className="ask finder">
      {names === null ? (
        <p className="hint">Looking for official names...</p>
      ) : names.length ? (
        <>
          <p className="hint">
            <b>Did you mean...</b> (official ingredient names)
          </p>
          <div className="picks">
            {names.map((n) => (
              <button key={n} type="button" className="btn sm" onClick={() => onPick({ kind: "official", name: n })}>
                {n}
              </button>
            ))}
          </div>
        </>
      ) : (
        <p className="hint">No official names match &ldquo;{typed}&rdquo;. Try the Latin name from your bottle, or use your own name.</p>
      )}

      {ownOpen ? (
        <div className="fld">
          <span>Your own name for it</span>
          <input value={own} onChange={(e) => setOwn(e.target.value)} maxLength={160} />
          <p className="hint">
            It prints exactly as you type it, and gets flagged as <b>not an official ingredient name</b> on the label page.
          </p>
          <div className="row">
            <button type="button" className="btn sm" disabled={!own.trim()} onClick={() => onPick({ kind: "custom", name: own.trim() })}>
              Use this name
            </button>
            <button type="button" className="btn ghost sm" onClick={() => setOwnOpen(false)}>
              Back
            </button>
          </div>
        </div>
      ) : (
        <div className="row">
          <button type="button" className="btn ghost sm" onClick={() => setOwnOpen(true)}>
            Use my own name
          </button>
          {onCancel && (
            <button type="button" className="btn ghost sm" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}
