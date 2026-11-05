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

  // Code step. The email has a code to type here and a link that works on any device.
  return (
    <form action={codeAction} className="card form">
      <p>
        We emailed <b>{emailState.email}</b>. Type the code from the email here, or tap the link in
        it on any device. It can take a minute, so check your spam folder too.
      </p>
      <label className="fld">
        <span>Code</span>
        <input
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]*"
          placeholder="123456"
          required
          autoFocus
        />
      </label>
      {codeState.error && <p className="error" role="alert">{codeState.error}</p>}
      <button className="btn pri" disabled={checking}>{checking ? "Checking..." : "Sign in"}</button>
      <button className="btn ghost" type="button" onClick={() => window.location.reload()}>
        Use a different email
      </button>
    </form>
  );
}
