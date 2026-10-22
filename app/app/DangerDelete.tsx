"use client";

import { useState } from "react";

const WORD = "DELETE";

/**
 * Two-step delete: open the warning, then type DELETE to enable the button.
 * The server checks the typed word too (field "confirm").
 */
export function DangerDelete({
  action,
  fields,
  label,
  what,
  consequences,
}: {
  action: (form: FormData) => void | Promise<void>;
  /** Hidden fields sent with the form (ids). */
  fields: Record<string, string>;
  /** Button text, e.g. "Delete this product". */
  label: string;
  /** What is being deleted, e.g. "Lavender Body Butter". */
  what: string;
  consequences: string[];
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const ready = typed.trim() === WORD;

  if (!open) {
    return (
      <button type="button" className="btn danger-outline sm" onClick={() => setOpen(true)}>
        {label}
      </button>
    );
  }

  return (
    <form action={action} className="danger-box form">
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <p>
        <b>Delete {what}?</b> This can&rsquo;t be undone.
      </p>
      <ul className="tight">
        {consequences.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      <label className="fld">
        <span>
          Type <b className="mono">{WORD}</b> to confirm
        </span>
        <input
          name="confirm"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-describedby={undefined}
        />
      </label>
      <div className="row">
        <button className="btn danger" disabled={!ready}>
          Delete forever
        </button>
        <button type="button" className="btn ghost" onClick={() => (setOpen(false), setTyped(""))}>
          Cancel
        </button>
      </div>
    </form>
  );
}
