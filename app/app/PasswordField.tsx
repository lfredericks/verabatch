"use client";

import { useActionState, useState } from "react";
import { setPassword, type PasswordState } from "./actions";

/** Optional password, so signing in doesn't always need an emailed code. */
export function PasswordField({ email }: { email: string }) {
  const [state, action, saving] = useActionState<PasswordState, FormData>(async (prev, form) => {
    const r = await setPassword(prev, form);
    if (r.saved) setOpen(false);
    return r;
  }, {});
  const [open, setOpen] = useState(false);

  return (
    <section className="card form" aria-labelledby="signin">
      <h2 id="signin">Signing in</h2>
      <p className="hint">
        Signed in as {email}. You stay signed in on this device. To skip the emailed code next time, set a password (optional).
      </p>
      {state.saved && !open && (
        <p className="ok" role="status">
          Password saved. Next time, pick &ldquo;Use my password&rdquo; on the sign-in page.
        </p>
      )}
      {open ? (
        <form action={action} className="form">
          <label className="fld">
            <span>New password (10 characters or more)</span>
            <input name="password" type="password" autoComplete="new-password" minLength={10} maxLength={72} required autoFocus />
          </label>
          <label className="fld">
            <span>Same password again</span>
            <input name="again" type="password" autoComplete="new-password" minLength={10} maxLength={72} required />
          </label>
          {state.error && (
            <p className="error" role="alert">
              {state.error}
            </p>
          )}
          <div className="row">
            <button className="btn pri" disabled={saving}>
              {saving ? "Saving..." : "Save password"}
            </button>
            <button type="button" className="btn ghost sm" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn sm cta" onClick={() => setOpen(true)}>
          Set a password
        </button>
      )}
    </section>
  );
}
