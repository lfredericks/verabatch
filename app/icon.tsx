import { ImageResponse } from "next/og";
import { activeTheme } from "@/lib/brand";
import { ICON_GLYPHS } from "@/lib/brand/icon";

/** Browser-tab icon: "vb" on the accent color (lib/brand/icon.ts). */
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  const c = activeTheme().colors.light;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: c.accent, borderRadius: 15 }}>
        <svg width="64" height="64" viewBox={ICON_GLYPHS.viewBox}>
          <path d={ICON_GLYPHS.d} fill={c.onAccent} />
        </svg>
      </div>
    ),
    size,
  );
}
