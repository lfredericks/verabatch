"use client";

import { useState } from "react";

/**
 * The label as it will look: the real shape (round, oval, rectangle) at the right
 * proportions, with a Front / Back switch. The PDF is the exact version.
 */
export function LabelPreview({
  shape,
  name,
  identity,
  net,
  back,
  bold,
  sizeText,
}: {
  shape: { kind: "rect" | "round" | "oval"; w: number; h: number } | null;
  name: string;
  identity: string;
  net: string | null;
  back: string[];
  /** Back lines printed in bold (warnings). */
  bold: string[];
  sizeText: string | null;
}) {
  const [side, setSide] = useState<"front" | "back">("front");
  // Fit the shape in a 260 x 300 box, keeping its proportions.
  const ratio = shape ? shape.w / shape.h : 1.5;
  const w = Math.round(Math.min(260, 300 * ratio));
  const h = Math.round(w / ratio);
  const kind = shape?.kind ?? "rect";

  return (
    <div className="preview">
      <div className="seg" role="group" aria-label="Label side">
        <button type="button" aria-pressed={side === "front"} onClick={() => setSide("front")}>
          Front
        </button>
        <button type="button" aria-pressed={side === "back"} onClick={() => setSide("back")}>
          Back
        </button>
      </div>
      <div className={`paper paper-${kind}${side === "back" ? " paper-back" : ""}`} style={side === "front" ? { width: w, height: h } : { width: Math.max(w, 260) }}>
        {side === "front" ? (
          <>
            <span className="paper-name">{name}</span>
            {identity && <span className="paper-id">{identity}</span>}
            {net && <span className="paper-net">{net.toUpperCase()}</span>}
          </>
        ) : (
          back.map((line) => (
            <span key={line} className={bold.includes(line) ? "paper-bold" : undefined}>
              {line}
            </span>
          ))
        )}
      </div>
      {sizeText && <p className="hint">{sizeText} · the PDF prints at exact size</p>}
    </div>
  );
}
