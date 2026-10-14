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
  rose: { id: "rose", label: "Rose", light: { fg: "#8C1D18", bg: "#FDE3DF" }, dark: { fg: "#FF9D95", bg: "rgba(229,72,77,0.18)" } },
  orange: { id: "orange", label: "Orange", light: { fg: "#A3511B", bg: "#FBE4D3" }, dark: { fg: "#F0A875", bg: "rgba(176,100,31,0.22)" } },
  amber: { id: "amber", label: "Amber", light: { fg: "#6B4310", bg: "#F6E7D3" }, dark: { fg: "#E0B27A", bg: "rgba(138,90,43,0.22)" } },
  lime: { id: "lime", label: "Lime", light: { fg: "#4D6B1B", bg: "#E3F0D3" }, dark: { fg: "#B5DD7A", bg: "rgba(92,140,45,0.2)" } },
  emerald: { id: "emerald", label: "Emerald", light: { fg: "#14502A", bg: "#D3E5D3" }, dark: { fg: "#6FDC8C", bg: "rgba(111,220,140,0.18)" } },
  teal: { id: "teal", label: "Teal", light: { fg: "#0F5C52", bg: "#D3EDE8" }, dark: { fg: "#6FD9C7", bg: "rgba(45,150,135,0.2)" } },
  cyan: { id: "cyan", label: "Cyan", light: { fg: "#0F5C72", bg: "#D3E9F0" }, dark: { fg: "#7FD4EA", bg: "rgba(45,130,150,0.2)" } },
  blue: { id: "blue", label: "Blue", light: { fg: "#123049", bg: "#C4E4FF" }, dark: { fg: "#CFE8FF", bg: "rgba(23,50,74,0.6)" } },
  indigo: { id: "indigo", label: "Indigo", light: { fg: "#1B4F7A", bg: "#D6E3F2" }, dark: { fg: "#9DC4EA", bg: "rgba(27,79,122,0.3)" } },
  violet: { id: "violet", label: "Violet", light: { fg: "#4B2E8C", bg: "#E6DDF6" }, dark: { fg: "#B39DDB", bg: "rgba(107,79,179,0.22)" } },
  pink: { id: "pink", label: "Pink", light: { fg: "#9B1D56", bg: "#F6D9E6" }, dark: { fg: "#F08FB8", bg: "rgba(155,29,86,0.22)" } },
  slate: { id: "slate", label: "Slate", light: { fg: "#4A5D50", bg: "#E8EEE9" }, dark: { fg: "#A7BBAD", bg: "#274034" } },
};

export const SWATCH_IDS = Object.keys(SWATCHES) as SwatchId[];

export function getSwatch(id: string): Swatch {
  return SWATCHES[id as SwatchId] ?? SWATCHES.slate;
}
