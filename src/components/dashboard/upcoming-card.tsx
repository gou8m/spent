import Link from "next/link";
import { differenceInCalendarDays } from "date-fns";
import { Calendar } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { IconChip } from "@/components/ui/icon-chip";
import { Amount } from "@/components/ui/amount";
import { EmptyState } from "@/components/ui/empty-state";
import type { TransactionWithRelations } from "@/lib/data/transactions";

function dueLabel(date: Date) {
  const days = differenceInCalendarDays(date, new Date());
  if (days < 0) return "Overdue";
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

export function UpcomingCard({ upcoming }: { upcoming: TransactionWithRelations[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming</CardTitle>
        <Link href="/recurring" className="text-sm font-medium text-accent-text hover:underline">
          Manage
        </Link>
      </CardHeader>
      <CardContent className="pt-3">
        {upcoming.length === 0 ? (
          <EmptyState icon={Calendar} title="Nothing upcoming" description="Scheduled bills and income will show up here." />
        ) : (
          <ul className="space-y-3.5">
            {upcoming.map((tx) => (
              <li key={tx.id} className="flex items-center gap-3">
                <IconChip icon={tx.category?.icon ?? "calendar"} color={tx.category?.color ?? "slate"} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">{tx.title}</p>
                  <p className="text-xs text-warning">{dueLabel(tx.date)}</p>
                </div>
                <Amount value={tx.amount} currency={tx.currency} direction={tx.type} signed size="sm" />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
