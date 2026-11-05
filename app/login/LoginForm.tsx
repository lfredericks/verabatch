"use client";

import { useActionState, useState } from "react";
import { sendCode, signInPassword, verifyCode, type LoginState } from "./actions";

const START: LoginState = { step: "email", email: "" };

export function LoginForm() {
  const [emailState, emailAction, sending] = useActionState(sendCode, START);
  const [codeState, codeAction, checking] = useActionState(verifyCode, emailState);
  const [pwState, pwAction, signingIn] = useActionState(signInPassword, START);
  const [usePassword, setUsePassword] = useState(false);
  const [forgot, setForgot] = useState(false);

  if (usePassword && !forgot) {
    return (
      <form action={pwAction} className="card form">
        <label className="fld">
          <span>Email</span>
          <input name="email" type="email" inputMode="email" autoComplete="email" defaultValue={pwState.email || emailState.email} placeholder="you@yourshop.com" required autoFocus />
        </label>
        <label className="fld">
          <span>Password</span>
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        {pwState.error && <p className="error" role="alert">{pwState.error}</p>}
        <button className="btn pri" disabled={signingIn}>{signingIn ? "Signing in..." : "Sign in"}</button>
        <button type="button" className="btn ghost sm" onClick={() => setForgot(true)}>
          Forgot your password?
        </button>
        <button type="button" className="btn ghost sm" onClick={() => setUsePassword(false)}>
          Email me a sign-in code instead
        </button>
      </form>
    );
  }

  if (forgot && emailState.step === "email") {
    return (
      <form action={emailAction} className="card form">
        <input type="hidden" name="reset" value="1" />
        <p>
          <b>Forgot your password?</b> We&rsquo;ll email you a code. Sign in with it, then set a new password.
        </p>
        <label className="fld">
          <span>Email</span>
          <input name="email" type="email" inputMode="email" autoComplete="email" defaultValue={pwState.email} placeholder="you@yourshop.com" required autoFocus />
        </label>
        <p className="hint">Your email is your username. Not sure which one you used? Search your inbox for a sign-in email from us.</p>
        {emailState.error && <p className="error" role="alert">{emailState.error}</p>}
        <button className="btn pri" disabled={sending}>{sending ? "Sending..." : "Email me a code"}</button>
        <button type="button" className="btn ghost sm" onClick={() => (setForgot(false), setUsePassword(true))}>
          Back to password
        </button>
      </form>
    );
  }

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
        <button className="btn pri" disabled={sending}>{sending ? "Sending..." : "Email me a sign-in code"}</button>
        <button type="button" className="btn ghost sm" onClick={() => setUsePassword(true)}>
          Use my password
        </button>
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
      <input type="hidden" name="email" value={emailState.email} />
      {emailState.reset && <input type="hidden" name="reset" value="1" />}
      <label className="fld">
        <span>Code</span>
        <input
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]*"
          placeholder="12345678"
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
