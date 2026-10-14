import * as React from "react";
import { cn } from "@/lib/utils";

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  /** Renders a dashed border instead of the normal filled/outline look — used
   * for "More"/"Add tag"-style buttons that open a picker rather than toggle
   * a value directly. */
  dashed?: boolean;
  icon?: React.ReactNode;
}

/** The pill used for category/tag/filter choices throughout the app —
 * 40px tall, fully round, 2px border. Unselected chips sit on a plain
 * surface-2 fill; selected ones get a sage fill, accent border and accent
 * text, matching every chip in the reference design. */
export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, selected = false, dashed = false, icon, children, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        aria-pressed={selected}
        className={cn(
          "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border-2 px-3.5 text-sm transition-colors",
          dashed
            ? "border-dashed border-accent-border bg-transparent font-bold text-text-secondary hover:bg-surface-2"
            : selected
              ? "border-accent bg-accent-subtle font-bold text-accent-hover"
              : "border-transparent bg-surface-2 font-semibold text-text-primary hover:bg-surface-3",
          className,
        )}
        {...props}
      >
        {icon}
        {children}
      </button>
    );
  },
);
Chip.displayName = "Chip";
