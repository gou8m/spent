import { cn } from "@/lib/utils";

type Tone = "accent" | "income" | "expense" | "warning" | "savings";

const toneClasses: Record<Tone, string> = {
  accent: "bg-accent",
  income: "bg-income",
  expense: "bg-expense",
  warning: "bg-warning",
  savings: "bg-savings",
};

export function Progress({
  value,
  tone = "accent",
  label,
  className,
  trackClassName,
}: {
  value: number;
  tone?: Tone;
  /** Accessible name for the progressbar, e.g. "62% of Groceries budget used". */
  label: string;
  className?: string;
  trackClassName?: string;
}) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-2", trackClassName)}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-300 ease-out", toneClasses[tone], className)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
