"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * A row of options with one "bubble" that glides to the selected option. Options may have different
 * widths (the bubble is measured), so it suits filter chips as well as equal-width segments.
 *   variant "chips":  a pill-shaped group, soft green bubble
 *   variant "filled": a solid green bubble (used by SegmentedControl)
 */
export function SlidingTabs<T extends string>({
  options,
  value,
  onChange,
  variant = "chips",
  className,
  buttonClassName,
  equal = false,
}: {
  options: { value: T; label: React.ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  variant?: "chips" | "filled";
  className?: string;
  buttonClassName?: string;
  /** Give every option the same width. */
  equal?: boolean;
}) {
  const refs = useRef(new Map<string, HTMLButtonElement>());
  const [box, setBox] = useState<{ left: number; width: number } | null>(null);
  // The bubble only animates after it has been placed once, so it never slides in from nowhere on first paint.
  const [placed, setPlaced] = useState(false);

  const measure = useCallback(() => {
    const el = refs.current.get(value);
    if (!el) return;
    setBox((prev) => (prev && prev.left === el.offsetLeft && prev.width === el.offsetWidth ? prev : { left: el.offsetLeft, width: el.offsetWidth }));
  }, [value]);

  useIsoLayoutEffect(() => {
    measure();
    const raf = requestAnimationFrame(() => setPlaced(true));
    return () => cancelAnimationFrame(raf);
  }, [measure]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const filled = variant === "filled";
  return (
    <div
      role="radiogroup"
      className={cn(
        "relative flex gap-1 p-1",
        filled ? "rounded-[20px] bg-surface-2" : "w-fit max-w-full overflow-x-auto rounded-full bg-surface-2 [scrollbar-width:none]",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-y-1 left-0 rounded-[16px] ease-[cubic-bezier(0.34,1.35,0.5,1)]",
          filled ? "bg-accent shadow-[0_4px_12px_rgba(27,107,51,0.25)]" : "rounded-full bg-accent shadow-[0_4px_12px_rgba(27,107,51,0.25)]",
          placed ? "transition-[transform,width] duration-[380ms]" : "transition-none",
        )}
        style={{ width: box?.width ?? 0, transform: `translateX(${box?.left ?? 0}px)`, opacity: box ? 1 : 0 }}
      />
      {options.map((opt) => {
        const on = opt.value === value;
        return (
          <button
            key={opt.value}
            ref={(node) => {
              if (node) refs.current.set(opt.value, node);
              else refs.current.delete(opt.value);
            }}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative z-10 shrink-0 text-sm transition-colors duration-300",
              filled ? "h-10.5 rounded-[16px] px-3" : "h-9 rounded-full px-3.5",
              equal && "flex-1",
              on ? "font-bold text-text-on-accent" : "font-semibold text-text-primary hover:text-accent-text",
              buttonClassName,
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
