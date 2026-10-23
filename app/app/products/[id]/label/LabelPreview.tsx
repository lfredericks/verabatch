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
  wrap = false,
  cutOff = "",
}: {
  shape: { kind: "rect" | "round" | "oval"; w: number; h: number } | null;
  name: string;
  identity: string;
  net: string | null;
  back: string[];
  /** Back lines printed in bold (warnings). */
  bold: string[];
  sizeText: string | null;
  /** One wraparound strip: front on the left, back text on the right. */
  wrap?: boolean;
  /** Back text that doesn't fit at the legal size (shown struck through). */
  cutOff?: string;
}) {
  const [side, setSide] = useState<"front" | "back">("front");
  // Fit the shape in a 260 x 300 box, keeping its proportions.
  const ratio = shape ? shape.w / shape.h : 1.5;
  const w = Math.round(Math.min(260, 300 * ratio));
  const h = Math.round(w / ratio);
  const kind = shape?.kind ?? "rect";

  const frontBits = (
    <>
      <span className="paper-name">{name}</span>
      {identity && <span className="paper-id">{identity}</span>}
      {net && <span className="paper-net">{net.toUpperCase()}</span>}
    </>
  );
  const backBits = (
    <>
      {back.map((line) => (
        <span key={line} className={bold.includes(line) ? "paper-bold" : undefined}>
          {line}
        </span>
      ))}
      {cutOff && <span className="paper-cut">Doesn&rsquo;t fit: {cutOff}</span>}
    </>
  );

  if (wrap) {
    // Wide strip: keep its proportions, as wide as the box allows.
    const ww = 320;
    return (
      <div className="preview">
        <div className="paper paper-wrap" style={{ width: ww, minHeight: Math.round(ww / ratio) }}>
          <div className="paper-wrap-front">{frontBits}</div>
          <div className="paper-wrap-back">{backBits}</div>
        </div>
        {sizeText && <p className="hint">{sizeText} · front on the left, back on the right · the PDF prints at exact size</p>}
      </div>
    );
  }

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
        {side === "front" ? frontBits : backBits}
      </div>
      {sizeText && <p className="hint">{sizeText} · the PDF prints at exact size</p>}
    </div>
  );
}
