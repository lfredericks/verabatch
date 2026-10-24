"use client";

import { useState } from "react";

/** The main "Open in Canva" button. Canva takes a few seconds to build the design, so say so. */
export function CanvaButton({ href }: { href: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <a href={href} className="bigbtn bigbtn-pri" aria-busy={busy} onClick={() => setBusy(true)}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 4h6v6" />
        <path d="M20 4l-9 9" />
        <path d="M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" />
      </svg>
      {busy ? "Opening Canva... a few seconds" : "Open in Canva"}
    </a>
  );
}
