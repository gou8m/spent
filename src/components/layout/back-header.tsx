import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The header every "second-level" (drill-down) screen uses — a 44px
 * rounded-square back button, a 26px/800 title, and an optional trailing
 * action (e.g. an edit or "+" button). Replaces the big accent-coloured
 * page title the four primary tabs use.
 */
export function BackHeader({
  href,
  title,
  action,
  className,
  desktopRoot = false,
}: {
  href: string;
  title: string;
  action?: ReactNode;
  className?: string;
  /** On desktop this page is a sidebar destination, so there is nothing to go back to:
   * the back button is hidden from md up and the title becomes the 32px page heading. */
  desktopRoot?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3", desktopRoot && "md:min-h-14 md:pr-28", className)}>
      <Link
        href={href}
        aria-label="Back"
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-surface-2 text-text-primary transition-colors hover:bg-surface-3",
          desktopRoot && "md:hidden",
        )}
      >
        <ChevronLeft size={22} strokeWidth={2} />
      </Link>
      <h1 className={cn("flex-1 truncate text-[1.625rem] font-extrabold tracking-tight text-text-primary", desktopRoot && "md:text-[2rem] md:tracking-[-1px]")}>{title}</h1>
      {action}
    </div>
  );
}
