"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "@/components/theme-provider";
import { Sun, Moon, Monitor } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

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
