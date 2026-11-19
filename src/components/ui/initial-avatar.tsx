import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "h-8 w-8 rounded-sm text-[0.8125rem]",
  md: "h-10 w-10 rounded-sm text-base",
  lg: "h-13 w-13 rounded-md text-xl",
};

/** A rounded square filled with the soft gradient of the current color theme. The profile picture and the
 * Birthday tile are both drawn with it, so they always match. */
export function GradientTile({ children, size = "md", className }: { children: ReactNode; size?: keyof typeof sizeClasses; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 select-none items-center justify-center font-extrabold text-text-on-accent", sizeClasses[size], className)}
      style={{ background: "linear-gradient(145deg, color-mix(in oklab, var(--accent), white 20%), var(--accent))" }}
    >
      {children}
    </span>
  );
}

/** The default profile picture: the person's initial on the theme gradient. */
export function InitialAvatar({ initial, size = "md", className }: { initial: string; size?: keyof typeof sizeClasses; className?: string }) {
  return (
    <GradientTile size={size} className={className}>
      {initial}
    </GradientTile>
  );
}
