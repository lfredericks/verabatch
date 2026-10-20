"use client";

import { useActionState } from "react";
import { sendCode, verifyCode, type LoginState } from "./actions";

const START: LoginState = { step: "email", email: "" };

export function LoginForm() {
  const [emailState, emailAction, sending] = useActionState(sendCode, START);
  const [codeState, codeAction, checking] = useActionState(verifyCode, emailState);

  if (emailState.step === "email") {
    return (
      <form action={emailAction} className="card form">
        <label className="fld">
          <span>Email</span>
          <input
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            defaultValue={emailState.email}
            placeholder="you@yourshop.com"
            required
            autoFocus
          />
        </label>
        {emailState.error && <p className="error" role="alert">{emailState.error}</p>}
        <button className="btn pri" disabled={sending}>{sending ? "Sending..." : "Email me a sign-in link"}</button>
      </form>
    );
  }

  // Sign-in link step. Supabase's default email has a link, not a code, until a custom
  // email sender is set up (see docs/SETUP.md). verifyCode stays ready for that.
  void codeState;
  void codeAction;
  void checking;
  return (
    <div className="card form">
      <p>
        We emailed a sign-in link to <b>{emailState.email}</b>. Open it on this device, in this browser.
        It can take a minute, so check your spam folder too.
      </p>
      <button className="btn ghost" type="button" onClick={() => window.location.reload()}>
        Use a different email
      </button>
    </div>
  );
}
