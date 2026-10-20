"use client";

import { useState } from "react";

/** Copy buttons for the front, back, or whole label text. */
export function CopyButtons({ front, back }: { front: string; back: string }) {
  const [copied, setCopied] = useState<string | null>(null);
  async function copy(which: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
    } catch {
      setCopied(null);
    }
  }
  const items: [string, string][] = [
    ["front", front],
    ["back", back],
    ["all", `${front}\n\n${back}`],
  ];
  return (
    <div className="row">
      {items.map(([k, t]) => (
        <button key={k} type="button" className={`btn sm${k === "all" ? " pri" : ""}`} onClick={() => copy(k, t)}>
          {copied === k ? "Copied" : k === "all" ? "Copy all" : `Copy ${k}`}
        </button>
      ))}
    </div>
  );
}
