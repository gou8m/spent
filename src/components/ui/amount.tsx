import { cn } from "@/lib/utils";
import { formatMoney, formatSignedMoney } from "@/lib/money";

type Direction = "INCOME" | "EXPENSE" | "TRANSFER" | "NEUTRAL";
type Size = "lg" | "md" | "sm";

const sizeClasses: Record<Size, string> = {
  lg: "text-[2.75rem] sm:text-[3.5rem] font-bold tracking-tighter",
  md: "text-[1.125rem] font-semibold",
  sm: "text-[0.9375rem] font-medium",
};

const directionClasses: Record<Direction, string> = {
  INCOME: "text-income",
  EXPENSE: "text-text-primary",
  TRANSFER: "text-text-secondary",
  NEUTRAL: "text-text-primary",
};

export function Amount({
  value,
  currency,
  locale = "en-US",
  direction = "NEUTRAL",
  size = "md",
  signed = false,
  className,
}: {
  value: number;
  currency: string;
  locale?: string;
  /** Accepts the raw string `type` field straight off a Prisma record. */
  direction?: Direction | (string & {});
  size?: Size;
  signed?: boolean;
  className?: string;
}) {
  const dir: Direction = direction in directionClasses ? (direction as Direction) : "NEUTRAL";
  const display =
    signed && dir !== "NEUTRAL" ? formatSignedMoney(value, currency, dir, locale) : formatMoney(value, currency, locale);

  return <span className={cn("font-numeric", sizeClasses[size], directionClasses[dir], className)}>{display}</span>;
}
