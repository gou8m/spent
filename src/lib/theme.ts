export type Theme = "light" | "dark" | "system";
export const THEME_STORAGE_KEY = "theme";

/** Same values as `viewport.themeColor` in app/layout.tsx (the app background in each theme). */
const THEME_COLOR = { light: "#F4FAF2", dark: "#0E1712" };

export function applyTheme(theme: Theme) {
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  // The status bar / browser chrome colour follows the app's own theme choice, not just the
  // OS setting the two media-conditioned <meta> tags react to (matters in the installed app).
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    meta.removeAttribute("media");
    meta.setAttribute("content", isDark ? THEME_COLOR.dark : THEME_COLOR.light);
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
