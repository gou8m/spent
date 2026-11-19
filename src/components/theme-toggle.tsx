"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "@/components/theme-provider";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { PALETTES } from "@/lib/theme";

const OPTIONS = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
] as const;

const noopSubscribe = () => () => {};

/** True only once we're past hydration — server and the first client render
 * must agree, and the theme read from localStorage isn't reliably safe for
 * that on its own, so this reads the client/server snapshot split directly. */
function useIsClient() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

const TILE_OPTIONS = [OPTIONS[2], OPTIONS[0], OPTIONS[1]] as const;

/** The current theme's label ("System", "Light", "Dark") for a settings row. */
export function ThemeValue() {
  const { theme } = useTheme();
  const mounted = useIsClient();
  const label = OPTIONS.find((o) => o.value === theme)?.label ?? "System";
  return <span className="text-sm font-semibold text-text-secondary">{mounted ? label : "System"}</span>;
}

/** Three large tiles (System / Light / Dark), the Preferences page treatment. */
export function ThemeTiles() {
  const { theme, setTheme } = useTheme();
  const mounted = useIsClient();

  return (
    <div className="flex gap-2.5" role="radiogroup" aria-label="Theme">
      {TILE_OPTIONS.map(({ value, icon: Icon, label }) => {
        const selected = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setTheme(value)}
            className={cn(
              "flex flex-1 flex-col items-center gap-2 rounded-[22px] border-2 px-2 py-3.5 text-sm transition-colors",
              selected
                ? "border-accent bg-accent-subtle font-bold text-accent-hover"
                : "border-transparent bg-surface-2 font-semibold text-text-primary hover:bg-surface-3",
            )}
          >
            <Icon size={22} strokeWidth={2} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const mounted = useIsClient();

  return (
    <div
      className={cn("inline-flex items-center gap-0.5 rounded-full bg-surface-2 p-0.5", className)}
      role="radiogroup"
      aria-label="Theme"
    >
      {OPTIONS.map(({ value, icon: Icon, label }) => (
        <Tooltip key={value}>
          <TooltipTrigger asChild>
            <button
              type="button"
              role="radio"
              aria-checked={mounted && theme === value}
              aria-label={label}
              onClick={() => setTheme(value)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                mounted && theme === value
                  ? "bg-surface text-text-primary shadow-xs"
                  : "text-text-muted hover:text-text-secondary",
              )}
            >
              <Icon size={15} strokeWidth={2} />
            </button>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

/** Compact inline System / Light / Dark switch with a sliding pill, for a settings card. */
export function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  const mounted = useIsClient();
  const index = Math.max(0, TILE_OPTIONS.findIndex((o) => o.value === theme));

  return (
    <div role="radiogroup" aria-label="Theme" className="relative grid grid-cols-3 rounded-full bg-surface p-1">
      <span
        aria-hidden
        className="absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-full bg-accent shadow-xs transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
        style={{ transform: `translateX(${mounted ? index * 100 : 0}%)` }}
      />
      {TILE_OPTIONS.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={mounted && theme === value}
          onClick={() => setTheme(value)}
          className={cn(
            "relative z-10 flex h-10 items-center justify-center gap-1.5 rounded-full text-[0.8125rem] font-bold transition-colors duration-300",
            mounted && theme === value ? "text-text-on-accent" : "text-text-secondary",
          )}
        >
          <Icon size={15} strokeWidth={2.25} />
          {label}
        </button>
      ))}
    </div>
  );
}

/** Round swatches for the color themes; the chosen one gets a ring and a check. */
export function PaletteSwatches() {
  const { palette, setPalette, theme } = useTheme();
  const mounted = useIsClient();
  const dark =
    mounted && (theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches));

  return (
    <div role="radiogroup" aria-label="Color theme" className="grid grid-cols-3 gap-1">
      {PALETTES.map((p) => {
        const selected = mounted && palette === p.value;
        return (
          <button
            key={p.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={p.label}
            onClick={() => setPalette(p.value)}
            className="flex flex-col items-center gap-1.5 py-1"
          >
            <span
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-surface-2 transition-all duration-300",
                selected ? "scale-105 ring-text-primary" : "ring-transparent",
              )}
              style={{ background: `linear-gradient(135deg, ${dark ? p.accentDark : p.accent} 50%, ${dark ? p.bgDark : p.bg} 50%)` }}
            >
              {selected && <Check size={18} strokeWidth={3} className="text-white drop-shadow" />}
            </span>
            <span className={cn("text-[0.6875rem] font-semibold", selected ? "text-text-primary" : "text-text-secondary")}>{p.label}</span>
          </button>
        );
      })}
    </div>
  );
}
