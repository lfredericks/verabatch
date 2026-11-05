import { ImageResponse } from "next/og";
import { activeTheme } from "@/lib/brand";
import { ICON_GLYPHS } from "@/lib/brand/icon";

/** Phone home-screen icon: "vb" on the accent color. iOS rounds the corners itself. */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const c = activeTheme().colors.light;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: c.accent }}>
        <svg width="180" height="180" viewBox={ICON_GLYPHS.viewBox}>
          <path d={ICON_GLYPHS.d} fill={c.onAccent} />
        </svg>
      </div>
    ),
    size,
  );
}
