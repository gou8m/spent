import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "income" | "expense" | "savings" | "warning" | "accent";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-surface-2 text-text-secondary",
  income: "bg-income-subtle text-income",
  expense: "bg-expense-subtle text-expense",
  savings: "bg-savings-subtle text-savings",
  warning: "bg-warning-subtle text-warning",
  accent: "bg-accent-subtle text-accent-text",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
