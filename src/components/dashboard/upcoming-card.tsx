import Link from "next/link";
import { format } from "date-fns";
import { Calendar } from "lucide-react";
import { IconChip } from "@/components/ui/icon-chip";
import { Amount } from "@/components/ui/amount";
import { EmptyState } from "@/components/ui/empty-state";
import type { TransactionWithRelations } from "@/lib/data/transactions";

export function UpcomingCard({ upcoming }: { upcoming: TransactionWithRelations[] }) {
  return (
    <section className="rounded-3xl bg-surface-2 px-5 py-4.5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[1.0625rem] font-bold text-text-primary">Upcoming bills</h2>
        <Link href="/recurring" className="text-[0.8125rem] font-bold text-accent-text hover:underline">
          Manage
        </Link>
      </div>
      {upcoming.length === 0 ? (
        <EmptyState icon={Calendar} title="Nothing upcoming" description="Scheduled bills and income will show up here." className="py-8" />
      ) : (
        <ul className="mt-3 space-y-3">
          {upcoming.map((tx) => (
            <li key={tx.id} className="flex items-center gap-3">
              <IconChip icon={tx.category?.icon ?? "calendar"} color={tx.category?.color ?? "slate"} size="md" flat className="rounded-[12px]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text-primary">{tx.title}</p>
                <p className="text-xs text-text-secondary">{format(tx.date, "MMM d")}</p>
              </div>
              <Amount value={tx.amount} currency={tx.currency} size="sm" className="text-sm font-bold text-text-primary" />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
