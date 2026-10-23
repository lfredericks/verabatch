import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { activeTheme, brand, brandText, googleFontsUrl, themeCss } from "@/lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: brand.name,
  description: brand.description,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = activeTheme();
  const fonts = googleFontsUrl(theme);
  return (
    <html lang="en">
      <head>
        {fonts && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
            <link rel="stylesheet" href={fonts} />
          </>
        )}
        {/* Theme colors, fonts and corners. Everything in globals.css reads these. */}
        <style dangerouslySetInnerHTML={{ __html: themeCss(theme) }} />
      </head>
      <body>
        {children}
        <footer className="disclaimer-line">
          {brandText(brand.disclaimerShort)} <Link href="/disclaimer">Read the full disclaimer</Link>
        </footer>
      </body>
    </html>
  );
}
