"use client";

import { useState } from "react";
import type { LabelPreviewData, PreviewItem } from "@/lib/labelPdf";

/**
 * The label exactly as the PDF lays it out: same shape and proportions, same line breaks,
 * same letter sizes (scaled to fit the screen). A Front / Back switch for two-label sizes;
 * a wraparound shows as one strip.
 */
export function LabelPreview({
  preview,
  fonts,
  logos,
  sizeText,
  cutOff = "",
}: {
  preview: LabelPreviewData;
  fonts: { serif: string; sans: string };
  /** Logo image links, in the order the PDF placed them. */
  logos: string[];
  sizeText: string | null;
  /** Back text that doesn't fit at the legal size. */
  cutOff?: string;
}) {
  const [side, setSide] = useState(0);
  const [zoom, setZoom] = useState(false);
  const two = preview.pages.length > 1;
  const page = preview.pages[two ? side : 0]!;
  const { w, h } = page;
  const back = two && side === 1;
  // Rect backs and wraps are rectangles; fronts take the label's own shape.
  const shape = back ? (preview.shape === "rect" ? "rect" : preview.shape) : preview.shape;
  const outline =
    shape === "round" || shape === "oval" ? (
      <ellipse cx={w / 2} cy={h / 2} rx={w / 2 - 0.5} ry={h / 2 - 0.5} fill="var(--label)" stroke="var(--line)" />
    ) : (
      <rect x={0.5} y={0.5} width={w - 1} height={h - 1} rx={Math.min(w, h) * 0.04} fill="var(--label)" stroke="var(--line)" />
    );

  const item = (it: PreviewItem, i: number) =>
    it.kind === "text" ? (
      <text
        key={i}
        x={it.x}
        y={it.baseline}
        fontSize={it.size}
        fontFamily={it.font === "serif" ? fonts.serif : fonts.sans}
        fontWeight={it.font === "sansBold" ? 700 : 400}
        fill="var(--label-ink)"
        xmlSpace="preserve"
      >
        {it.text}
      </text>
    ) : logos[it.logo] ? (
      <image key={i} href={logos[it.logo]} x={it.x} y={it.top} width={it.w} height={it.h} preserveAspectRatio="xMidYMid meet" />
    ) : null;

  return (
    <div className="preview">
      {two && (
        <div className="seg" role="group" aria-label="Label side">
          <button type="button" aria-pressed={side === 0} onClick={() => setSide(0)}>
            Front
          </button>
          <button type="button" aria-pressed={side === 1} onClick={() => setSide(1)}>
            Back
          </button>
        </div>
      )}
      <div className={zoom ? "label-zoom" : undefined}>
      <svg
        className="label-svg"
        viewBox={`0 0 ${w} ${h}`}
        style={zoom ? { width: w * 1.6, aspectRatio: `${w} / ${h}` } : { width: "100%", maxWidth: Math.min(360, (w / h) * 300), aspectRatio: `${w} / ${h}` }}
        role="img"
        aria-label={preview.wrap ? "Wraparound label preview" : back ? "Back label preview" : "Front label preview"}
      >
        {outline}
        {preview.wrap && <line x1={preview.splitX} y1={4} x2={preview.splitX} y2={h - 4} stroke="var(--line)" strokeDasharray="3 3" />}
        {page.items.map(item)}
      </svg>
      </div>
      {preview.wrap && (
        <button type="button" className="btn sm" onClick={() => setZoom(!zoom)}>
          {zoom ? "Fit to screen" : "Zoom in to read it"}
        </button>
      )}
      {cutOff && (!two || back) && <p className="paper-cut">Doesn&rsquo;t fit: {cutOff}</p>}
      {sizeText && (
        <p className="hint">
          {sizeText}
          {preview.wrap ? " · front on the left, back on the right" : ""} · shown to scale, the PDF prints at exact size
        </p>
      )}
    </div>
  );
}
