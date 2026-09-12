/**
 * The fixed palette used for category, tag, budget and goal colors, plus
 * chart series. Every hue ships a light-mode pair (readable icon/text tone +
 * subtle tint background) and a dark-mode pair, so components never need to
 * compute contrast themselves — just look up the swatch and theme.
 */

export type SwatchId =
  | "rose"
  | "orange"
  | "amber"
  | "lime"
  | "emerald"
  | "teal"
  | "cyan"
  | "blue"
  | "indigo"
  | "violet"
  | "pink"
  | "slate";

interface Swatch {
  id: SwatchId;
  label: string;
  light: { fg: string; bg: string };
  dark: { fg: string; bg: string };
}

export const SWATCHES: Record<SwatchId, Swatch> = {
  rose: { id: "rose", label: "Rose", light: { fg: "#E11D48", bg: "#FDE7EC" }, dark: { fg: "#FB7185", bg: "rgba(225,29,72,0.18)" } },
  orange: { id: "orange", label: "Orange", light: { fg: "#EA580C", bg: "#FDECE1" }, dark: { fg: "#FB923C", bg: "rgba(234,88,12,0.18)" } },
  amber: { id: "amber", label: "Amber", light: { fg: "#D97706", bg: "#FCEFD9" }, dark: { fg: "#FBBF24", bg: "rgba(217,119,6,0.18)" } },
  lime: { id: "lime", label: "Lime", light: { fg: "#65A30D", bg: "#EEF5DC" }, dark: { fg: "#A3E635", bg: "rgba(101,163,13,0.18)" } },
  emerald: { id: "emerald", label: "Emerald", light: { fg: "#059669", bg: "#DCF3EA" }, dark: { fg: "#34D399", bg: "rgba(5,150,105,0.18)" } },
  teal: { id: "teal", label: "Teal", light: { fg: "#0D9488", bg: "#DCF2F0" }, dark: { fg: "#2DD4BF", bg: "rgba(13,148,136,0.18)" } },
  cyan: { id: "cyan", label: "Cyan", light: { fg: "#0891B2", bg: "#DCF0F5" }, dark: { fg: "#22D3EE", bg: "rgba(8,145,178,0.18)" } },
  blue: { id: "blue", label: "Blue", light: { fg: "#2563EB", bg: "#E1EAFC" }, dark: { fg: "#60A5FA", bg: "rgba(37,99,235,0.18)" } },
  indigo: { id: "indigo", label: "Indigo", light: { fg: "#4F46E5", bg: "#E7E5FC" }, dark: { fg: "#818CF8", bg: "rgba(79,70,229,0.18)" } },
  violet: { id: "violet", label: "Violet", light: { fg: "#7C3AED", bg: "#EFE5FC" }, dark: { fg: "#A78BFA", bg: "rgba(124,58,237,0.18)" } },
  pink: { id: "pink", label: "Pink", light: { fg: "#DB2777", bg: "#FBE1EC" }, dark: { fg: "#F472B6", bg: "rgba(219,39,119,0.18)" } },
  slate: { id: "slate", label: "Slate", light: { fg: "#475569", bg: "#E7EAEE" }, dark: { fg: "#94A3B8", bg: "rgba(71,85,105,0.22)" } },
};

export const SWATCH_IDS = Object.keys(SWATCHES) as SwatchId[];

export function getSwatch(id: string): Swatch {
  return SWATCHES[id as SwatchId] ?? SWATCHES.slate;
}
