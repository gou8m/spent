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
}: {
  href: string;
  title: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Link
        href={href}
        aria-label="Back"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-surface-2 text-text-primary transition-colors hover:bg-surface-3"
      >
        <ChevronLeft size={22} strokeWidth={2} />
      </Link>
      <h1 className="flex-1 truncate text-[1.625rem] font-extrabold tracking-tight text-text-primary">{title}</h1>
      {action}
    </div>
  );
}
