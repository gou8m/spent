import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "h-8 w-8 rounded-sm text-[0.8125rem]",
  md: "h-10 w-10 rounded-sm text-base",
  lg: "h-13 w-13 rounded-md text-xl",
};

/** The default profile picture: the person's initial on a soft gradient in the current color theme. */
export function InitialAvatar({ initial, size = "md", className }: { initial: string; size?: keyof typeof sizeClasses; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 select-none items-center justify-center font-extrabold text-text-on-accent", sizeClasses[size], className)}
      style={{ background: "linear-gradient(145deg, color-mix(in oklab, var(--accent), white 20%), var(--accent))" }}
    >
      {initial}
    </span>
  );
}
