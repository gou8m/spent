import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        // overflow-hidden so full-bleed content (a `p-0` card's single edge-to-edge
        // button, or a `divide-y` list's first/last row) has its own square-cornered
        // hover/active background clipped to this rounded shape, instead of poking
        // out past it with sharp corners — e.g. Profile's "Sign out" button.
        "overflow-hidden rounded-3xl bg-surface shadow-md",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center justify-between gap-3 px-5 pt-5", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  // h2, not h3 — a Card almost always sits directly under a page's h1 with nothing in
  // between, so h3 here was a level skip (axe: heading-order) on every page that uses it.
  return <h2 className={cn("text-[1.0625rem] font-semibold text-text-primary", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}
