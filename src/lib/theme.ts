export type Theme = "light" | "dark" | "system";
export const THEME_STORAGE_KEY = "theme";

export function applyTheme(theme: Theme) {
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
}

/** Briefly disables all CSS transitions so a theme switch doesn't sweep across the page. */
export function suppressTransitionsBriefly() {
  const style = document.createElement("style");
  style.textContent = "*,*::before,*::after{transition:none!important}";
  document.head.appendChild(style);
  void document.body.offsetHeight; // forces a reflow so the no-transition style takes effect before it's removed
  requestAnimationFrame(() => document.head.removeChild(style));
}
