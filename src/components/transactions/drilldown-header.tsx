import Link from "next/link";
import { CalendarDays, Tag, SlidersHorizontal, ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { formatMoney } from "@/lib/money";

/** Header for /transactions when it is opened from a Reports category (reference
 * screen 57): back button, category title, the active-filter chips and a total card. */
export function DrilldownHeader({
  categoryName,
  type,
  from,
  to,
  total,
  count,
  currency,
}: {
  categoryName: string;
  type: string;
  from: string | null;
  to: string | null;
  total: number;
  count: number;
  currency: string;
}) {
  const isIncome = type === "INCOME";
  const range =
    from && to
      ? format(new Date(from), "MMM yyyy") === format(new Date(to), "MMM yyyy")
        ? format(new Date(from), "MMM yyyy")
        : `${format(new Date(from), "MMM d")} - ${format(new Date(to), "MMM d, yyyy")}`
      : null;

  return (
    <div className="space-y-3.5">
      <div className="flex items-center gap-3">
        <Link
          href="/reports"
          aria-label="Back to reports"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-surface-2 text-text-primary transition-colors hover:bg-surface-3"
        >
          <ChevronLeft size={22} strokeWidth={2} />
        </Link>
        <h1 className="flex-1 truncate text-[1.625rem] font-extrabold tracking-tight text-text-primary">{categoryName}</h1>
        <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-surface-2 text-text-primary">
          <SlidersHorizontal size={20} strokeWidth={2} />
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex h-10 items-center gap-1.5 rounded-full border-2 border-accent bg-accent-subtle px-3.5 text-sm font-bold text-accent-hover">
          <Tag size={14} strokeWidth={2} />
          {categoryName}
        </span>
        {range && (
          <span className="inline-flex h-10 items-center gap-1.5 rounded-full border-2 border-accent bg-accent-subtle px-3.5 text-sm font-bold text-accent-hover">
            <CalendarDays size={14} strokeWidth={2} />
            {range}
          </span>
        )}
      </div>

      <section className="rounded-[28px] px-5.5 py-4 text-hero-text" style={{ background: "var(--hero-gradient)" }}>
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-semibold text-hero-text-secondary">{isIncome ? "Earned" : "Spent"} in this range</p>
          <p className="text-[0.8125rem] font-bold text-hero-text-secondary">
            {count} {count === 1 ? "transaction" : "transactions"}
          </p>
        </div>
        <p className="mt-0.5 text-[2.5rem] font-extrabold tracking-[-1.5px]">{formatMoney(total, currency)}</p>
      </section>
    </div>
  );
}
