"use client";

import { useActionState } from "react";
import { saveMaterial, type AddState } from "../../materialActions";

/** "More details": rename, what's in a blend, a note. Tucked away so the page stays simple. */
export function MaterialForm({ id, name, blend, note }: { id: string; name: string; blend: string; note: string }) {
  const [state, action, saving] = useActionState<AddState & { saved?: boolean }, FormData>(
    async (p, f) => ({ ...(await saveMaterial(p, f)), saved: true }),
    {},
  );
  return (
    <details className="card">
      <summary>
        <b>More details</b>
      </summary>
      <form action={action} className="stack">
        <input type="hidden" name="id" value={id} />
        <label className="fld">
          <span>Name</span>
          <input name="name" defaultValue={name} required maxLength={120} />
        </label>
        <label className="fld">
          <span>If it&rsquo;s a blend, what&rsquo;s in it</span>
          <input name="blend" defaultValue={blend} maxLength={2000} placeholder="Shea, cocoa butter, mango butter" />
        </label>
        <label className="fld">
          <span>Note</span>
          <textarea name="note" defaultValue={note} maxLength={2000} rows={2} />
        </label>
        {state.error ? (
          <p className="error" role="alert">
            {state.error}
          </p>
        ) : (
          state.saved && (
            <p className="ok" role="status">
              Saved.
            </p>
          )
        )}
        <button className="btn" disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </form>
    </details>
  );
}
