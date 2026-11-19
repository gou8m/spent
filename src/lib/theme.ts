export type Theme = "light" | "dark" | "system";
export const THEME_STORAGE_KEY = "theme";
export const PALETTE_STORAGE_KEY = "palette";

export type Palette = "mint" | "ocean" | "graphite";

/** Color themes offered in Settings. `mint` is the default (no override); the swatch shows each accent. */
export const PALETTES: { value: Palette; label: string; accent: string; accentDark: string; bg: string; bgDark: string }[] = [
  { value: "mint", label: "Mint", accent: "#1b6b33", accentDark: "#6fdc8c", bg: "#f4faf2", bgDark: "#0e1712" },
  { value: "ocean", label: "Ocean", accent: "#1b5f8f", accentDark: "#6cb9f0", bg: "#f1f7fb", bgDark: "#0d1620" },
  { value: "graphite", label: "Graphite", accent: "#2f3b45", accentDark: "#b9c6d1", bg: "#f4f5f6", bgDark: "#101214" },
];

export function applyPalette(palette: Palette) {
  if (palette === "mint") document.documentElement.removeAttribute("data-palette");
  else document.documentElement.setAttribute("data-palette", palette);
  const isDark = document.documentElement.classList.contains("dark");
  const p = PALETTES.find((x) => x.value === palette) ?? PALETTES[0];
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    meta.removeAttribute("media");
    meta.setAttribute("content", isDark ? p.bgDark : p.bg);
  });
}

export function applyTheme(theme: Theme) {
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  // The status bar / browser chrome colour follows the app's own theme choice, not just the
  // OS setting the two media-conditioned <meta> tags react to (matters in the installed app).
  const palette = PALETTES.find((x) => x.value === document.documentElement.getAttribute("data-palette")) ?? PALETTES[0];
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    meta.removeAttribute("media");
    meta.setAttribute("content", isDark ? palette.bgDark : palette.bg);
  });
}

/** Briefly disables all CSS transitions so a theme switch doesn't sweep across the page. */
export function suppressTransitionsBriefly() {
  const style = document.createElement("style");
  style.textContent = "*,*::before,*::after{transition:none!important}";
  document.head.appendChild(style);
  void document.body.offsetHeight; // forces a reflow so the no-transition style takes effect before it's removed
  requestAnimationFrame(() => document.head.removeChild(style));
}
