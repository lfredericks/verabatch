"use client";

import { useEffect } from "react";

/** Temporary: report taps, submits and errors to /api/diag (no field values). */
export function Diagnostics() {
  useEffect(() => {
    const send = (event: string, detail: Record<string, unknown> = {}) => {
      try {
        const data = JSON.stringify({ event, path: location.pathname, t: new Date().toISOString(), ...detail });
        if (!navigator.sendBeacon?.("/api/diag", new Blob([data], { type: "text/plain" }))) {
          void fetch("/api/diag", { method: "POST", body: data, keepalive: true });
        }
      } catch {
        /* never break the page */
      }
    };
    const describe = (el: Element | null) => {
      if (!el) return null;
      const b = el.closest("button, a, input, select");
      if (!b) return el.tagName;
      const btn = b as HTMLButtonElement;
      return { tag: b.tagName, type: btn.type, text: (b.textContent ?? "").trim().slice(0, 60), disabled: btn.disabled, inForm: Boolean(b.closest("form")) };
    };
    const onClick = (e: Event) => {
      const d = describe(e.target as Element);
      if (d && typeof d === "object" && d.tag === "BUTTON") send("tap", { button: d });
    };
    const onSubmit = (e: Event) => {
      const f = e.target as HTMLFormElement;
      send("submit", { defaultPrevented: e.defaultPrevented, valid: f.checkValidity?.() });
    };
    const onInvalid = (e: Event) => {
      const el = e.target as HTMLInputElement;
      send("invalid", { field: `${el.tagName} ${el.name} ${el.type}`, msg: el.validationMessage });
    };
    const onError = (e: ErrorEvent) => send("error", { msg: String(e.message).slice(0, 300), src: e.filename, line: e.lineno });
    const onRejection = (e: PromiseRejectionEvent) => send("rejection", { msg: String(e.reason?.message ?? e.reason).slice(0, 300) });
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    document.addEventListener("invalid", onInvalid, true);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    send("page", { ua: navigator.userAgent.slice(0, 160), requestSubmit: typeof HTMLFormElement.prototype.requestSubmit });
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      document.removeEventListener("invalid", onInvalid, true);
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}
