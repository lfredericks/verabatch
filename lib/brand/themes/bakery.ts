import type { Theme } from "../types";
import { defaultTheme } from "./default";

/**
 * Sample reskin for a future baked-goods / cottage-food market.
 * Shows how a theme only lists what's different from the default.
 */
export const bakeryTheme: Theme = {
  ...defaultTheme,
  id: "bakery",
  label: "Bakery sample (cream and tomato)",
  colors: {
    light: {
      ...defaultTheme.colors.light,
      paper: "#f4eee4",
      surface: "#fffaf3",
      sunk: "#ece3d5",
      ink: "#2b211b",
      muted: "#6e5f53",
      line: "#e0d4c3",
      accent: "#b5432f",
      accentSoft: "#f6dfd8",
      labelAccent: "#b5432f",
    },
    dark: {
      ...defaultTheme.colors.dark,
      paper: "#1a1512",
      surface: "#231d19",
      sunk: "#1e1916",
      ink: "#f1e8de",
      muted: "#b1a294",
      line: "#3a302a",
      accent: "#ec8a73",
      accentSoft: "#43251d",
      onAccent: "#2a120c",
      labelAccent: "#b5432f",
    },
  },
  fonts: {
    ...defaultTheme.fonts,
    display: { stack: '"Fraunces", Georgia, serif', google: "Fraunces:wght@500" },
  },
  radius: { card: "18px", control: "999px", small: "12px" },
  mark: "circle",
};
