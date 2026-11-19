"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { applyPalette, applyTheme, suppressTransitionsBriefly, PALETTE_STORAGE_KEY, THEME_STORAGE_KEY, type Palette, type Theme } from "@/lib/theme";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  palette: Palette;
  setPalette: (palette: Palette) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system";
    try {
      return (localStorage.getItem(THEME_STORAGE_KEY) as Theme | null) ?? "system";
    } catch {
      return "system";
    }
  });

  const [palette, setPaletteState] = useState<Palette>(() => {
    if (typeof window === "undefined") return "mint";
    try {
      return (localStorage.getItem(PALETTE_STORAGE_KEY) as Palette | null) ?? "mint";
    } catch {
      return "mint";
    }
  });

  useLayoutEffect(() => {
    applyPalette(palette);
    applyTheme(theme);
  }, [palette, theme]);

  const setPalette = useCallback((next: Palette) => {
    suppressTransitionsBriefly();
    setPaletteState(next);
    try {
      localStorage.setItem(PALETTE_STORAGE_KEY, next);
    } catch {
      // Not persisted if storage is blocked.
    }
  }, []);

  // React's Strict Mode dev remount clears the class the inline <head> script
  // already set before hydration; this re-applies it so it sticks.
  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    suppressTransitionsBriefly();
    setThemeState(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // localStorage unavailable (private browsing, blocked storage) — theme just won't persist.
    }
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme, palette, setPalette }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
