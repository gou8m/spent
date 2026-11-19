"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parse,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, Flag, Handshake, PartyPopper, Plus, Target, Clock, Wallet } from "lucide-react";
import { BackHeader } from "@/components/layout/back-header";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SlidingTabs } from "@/components/ui/sliding-tabs";
import { MonthSelector } from "@/components/ui/month-selector";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { SheetLink } from "@/components/ui/sheet-link";
import { TransactionRow } from "@/components/transactions/transaction-row";
import { getCalendarMonthAction } from "@/actions/calendar";
import { useTransactionSheet } from "@/stores/ui-store";
import { formatMoney } from "@/lib/money";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { CalendarItem, CalendarMonthData } from "@/lib/data/calendar";

type TypeFilter = "all" | "EXPENSE" | "INCOME" | "BILLS";
type Tx = CalendarMonthData["transactions"][number];

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const key = (d: Date) => format(d, "yyyy-MM-dd");

const KIND_META: Record<CalendarItem["kind"], { label: string; dot: string; icon: typeof Clock }> = {
  BILL: { label: "Bill due", dot: "bg-warning", icon: Clock },
  LOAN: { label: "Loan due", dot: "bg-savings", icon: Handshake },
  GOAL: { label: "Goal date", dot: "bg-[#6B4FB3]", icon: Target },
  BUDGET: { label: "Budget ends", dot: "bg-[#0F8F82]", icon: Wallet },
  HOLIDAY: { label: "Holiday", dot: "bg-[#C2417A]", icon: PartyPopper },
};

interface DayInfo {
  income: number;
  expense: number;
  count: number;
  txs: Tx[];
  items: CalendarItem[];
  hasBill: boolean;
}

const noopSubscribe = () => () => {};

/** Days, "today" and times depend on the viewer's own timezone and clock, which the server does not know:
 * the calendar is drawn in the browser only (the server sends an outline), so the two never disagree. */
function useIsClient() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export function CalendarView(props: Parameters<typeof CalendarBody>[0]) {
  const isClient = useIsClient();
  if (!isClient) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-sm bg-surface-3" />
          <Skeleton className="h-8 w-40 rounded-xl bg-surface-3" />
        </div>
        <Skeleton className="h-36 w-full rounded-[28px] bg-surface-3" />
        <Skeleton className="h-10 w-72 rounded-full" />
        <Skeleton className="h-80 w-full rounded-[22px]" />
      </div>
    );
  }
  return <CalendarBody {...props} />;
}

function CalendarBody({
  initial,
  agenda,
  accounts,
  currency,
}: {
  initial: CalendarMonthData;
  agenda: CalendarItem[];
  accounts: { id: string; name: string; currency: string }[];
  currency: string;
}) {
  const openTransaction = useTransactionSheet((s) => s.open);
  const [monthKey, setMonthKey] = useState(initial.month);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [accountId, setAccountId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Date | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);

  // Months already fetched. After the server renders again (a transaction was saved) the saved copy is stale, so start over from the fresh one.
  const cache = useRef(new Map<string, CalendarMonthData>([[initial.month, initial]]));
  const [seenInitial, setSeenInitial] = useState(initial);
  const [data, setData] = useState<CalendarMonthData>(initial);
  if (initial !== seenInitial) {
    setSeenInitial(initial);
    cache.current = new Map([[initial.month, initial]]);
    if (monthKey === initial.month) setData(initial);
    else void load(monthKey);
  }

  const monthDate = useMemo(() => parse(monthKey, "yyyy-MM", new Date()), [monthKey]);

  async function load(month: string) {
    const hit = cache.current.get(month);
    if (hit) {
      setData(hit);
      return;
    }
    try {
      const fresh = await getCalendarMonthAction(month);
      cache.current.set(month, fresh);
      setData((current) => (month === monthKeyRef.current ? fresh : current));
    } catch {
      // Leave the outline showing; tapping the month again retries.
    }
  }

  const monthKeyRef = useRef(monthKey);
  useEffect(() => {
    monthKeyRef.current = monthKey;
  });

  // After a month shows, quietly fetch the two beside it so swiping on is instant.
  useEffect(() => {
    const around = [addMonths(monthDate, -1), addMonths(monthDate, 1)].map((d) => format(d, "yyyy-MM"));
    const timer = setTimeout(() => {
      for (const m of around) {
        if (!cache.current.has(m)) void getCalendarMonthAction(m).then((fresh) => cache.current.set(m, fresh)).catch(() => {});
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [monthDate]);

  function goTo(target: Date) {
    const next = format(target, "yyyy-MM");
    if (next === monthKey) return;
    setDirection(next > monthKey ? 1 : -1);
    setMonthKey(next);
    setSelected(null);
    void load(next);
    window.history.replaceState(window.history.state, "", next === format(new Date(), "yyyy-MM") ? window.location.pathname : `?month=${next}`);
  }

  // While the next month is on its way the old month's rows must not be read as this month's.
  const ready = data.month === monthKey;

  // ---- the month, filtered, per day
  const days = useMemo(() => {
    const map = new Map<string, DayInfo>();
    const info = (k: string) => {
      let d = map.get(k);
      if (!d) {
        d = { income: 0, expense: 0, count: 0, txs: [], items: [], hasBill: false };
        map.set(k, d);
      }
      return d;
    };
    if (!ready) return map;
    for (const tx of data.transactions) {
      if (accountId && tx.accountId !== accountId && tx.transferToAccountId !== accountId) continue;
      if (typeFilter === "EXPENSE" && tx.type !== "EXPENSE") continue;
      if (typeFilter === "INCOME" && tx.type !== "INCOME") continue;
      if (typeFilter === "BILLS" && tx.status !== "UPCOMING") continue;
      const d = info(key(new Date(tx.date)));
      d.txs.push(tx);
      d.count++;
      if (tx.status === "UPCOMING") d.hasBill = true;
      // Only completed money in the main currency counts toward the day's totals.
      if (tx.status === "COMPLETED" && tx.currency === currency) {
        if (tx.type === "EXPENSE") d.expense += tx.amount;
        else if (tx.type === "INCOME") d.income += tx.amount;
      }
    }
    if (typeFilter === "all" || typeFilter === "BILLS") {
      for (const item of data.items) {
        const d = info(key(new Date(item.date)));
        d.items.push(item);
        if (item.kind === "BILL") d.hasBill = true;
      }
    }
    return map;
  }, [data, ready, typeFilter, accountId, currency]);

  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    let biggest: { date: string; amount: number } | null = null;
    let spendDays = 0;
    for (const [k, d] of days) {
      if (!k.startsWith(monthKey)) continue;
      income += d.income;
      expense += d.expense;
      if (d.expense > 0) spendDays++;
      if (d.expense > 0 && (!biggest || d.expense > biggest.amount)) biggest = { date: k, amount: d.expense };
    }
    const daysInMonth = endOfMonth(monthDate).getDate();
    const elapsed = isSameMonth(new Date(), monthDate) ? new Date().getDate() : monthDate < new Date() ? daysInMonth : 0;
    const noSpendDays = Math.max(0, elapsed - spendDays);
    return { income, expense, net: income - expense, perDay: elapsed > 0 ? Math.round(expense / elapsed) : 0, biggest, noSpendDays, elapsed };
  }, [days, monthKey, monthDate]);

  const maxExpense = useMemo(() => {
    let m = 0;
    for (const [k, d] of days) if (k.startsWith(monthKey) && d.expense > m) m = d.expense;
    return m;
  }, [days, monthKey]);

  const gridDays = eachDayOfInterval({ start: startOfWeek(startOfMonth(monthDate)), end: endOfWeek(endOfMonth(monthDate)) });
  const hasOtherCurrency = ready && data.transactions.some((t) => t.currency !== currency);

  // ---- swipe between months
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const selectedInfo = selected ? days.get(key(selected)) : undefined;
  const selectedNet = selectedInfo ? selectedInfo.income - selectedInfo.expense : 0;

  return (
    <div className="space-y-4">
      <BackHeader
        desktopRoot
        href="/dashboard"
        title="Calendar"
        action={
          <button
            type="button"
            onClick={() => goTo(new Date())}
            className="h-11 shrink-0 rounded-sm bg-surface-2 px-4 text-sm font-bold text-text-primary transition-colors hover:bg-surface-3"
          >
            Today
          </button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[3fr_2fr] lg:gap-6">
        <div className="min-w-0 space-y-4">
          {/* Month controls */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => goTo(addMonths(monthDate, -1))}
              className="flex h-11 w-11 items-center justify-center rounded-sm bg-surface-2 text-text-primary transition-colors hover:bg-surface-3"
            >
              <ChevronLeft size={20} />
            </button>
            <MonthSelector month={monthDate} onChange={(m) => goTo(m)} />
            <button
              type="button"
              aria-label="Next month"
              onClick={() => goTo(addMonths(monthDate, 1))}
              className="flex h-11 w-11 items-center justify-center rounded-sm bg-surface-2 text-text-primary transition-colors hover:bg-surface-3"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* The month at a glance */}
          <div className="rounded-2xl px-6 py-5 text-hero-text" style={{ background: "var(--hero-gradient)" }}>
            <p className="text-[0.9375rem] font-semibold text-hero-text-secondary">Spent in {format(monthDate, "MMMM")}</p>
            <p className="mt-1 text-[2.25rem] font-extrabold leading-tight tracking-[-0.03em]">{formatMoney(summary.expense, currency)}</p>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <span className="flex flex-col items-center rounded-2xl bg-white/20 px-3 py-2 text-center dark:bg-black/10">
                <span className="text-[0.6875rem] font-semibold text-hero-text-secondary">Money in</span>
                <span className="text-[0.9375rem] font-bold">+{formatMoney(summary.income, currency)}</span>
              </span>
              <span className="flex flex-col items-center rounded-2xl bg-white/20 px-3 py-2 text-center dark:bg-black/10">
                <span className="text-[0.6875rem] font-semibold text-hero-text-secondary">Net</span>
                <span className="text-[0.9375rem] font-bold">
                  {summary.net >= 0 ? "+" : "-"}
                  {formatMoney(Math.abs(summary.net), currency)}
                </span>
              </span>
            </div>
            {summary.elapsed > 0 && (
              <div className="mt-3.5 grid grid-cols-3 gap-2.5 text-center text-hero-text-secondary">
                <span className="flex flex-col text-[0.6875rem] font-semibold">
                  A day
                  <span className="text-[0.8125rem] font-bold text-hero-text">{formatMoney(summary.perDay, currency, undefined, { decimals: 0 })}</span>
                </span>
                <span className="flex flex-col text-[0.6875rem] font-semibold">
                  {summary.biggest ? `Biggest day, ${format(parse(summary.biggest.date, "yyyy-MM-dd", new Date()), "MMM d")}` : "Biggest day"}
                  <span className="text-[0.8125rem] font-bold text-hero-text">{summary.biggest ? formatMoney(summary.biggest.amount, currency, undefined, { decimals: 0 }) : "none"}</span>
                </span>
                <span className="flex flex-col text-[0.6875rem] font-semibold">
                  No-spend days
                  <span className="text-[0.8125rem] font-bold text-hero-text">{summary.noSpendDays}</span>
                </span>
              </div>
            )}
          </div>
          {hasOtherCurrency && <p className="-mt-2 text-xs text-text-secondary">Totals count {currency} only; other-currency transactions are listed on their day.</p>}

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <SlidingTabs
              options={[
                { value: "all" as TypeFilter, label: "All" },
                { value: "EXPENSE" as TypeFilter, label: "Spent" },
                { value: "INCOME" as TypeFilter, label: "Income" },
                { value: "BILLS" as TypeFilter, label: "Bills" },
              ]}
              value={typeFilter}
              onChange={setTypeFilter}
            />
            {accounts.length > 1 && (
              <div className="min-w-40 flex-1">
                <SearchableSelect
                  value={accountId}
                  onChange={setAccountId}
                  options={accounts.map((a) => ({ value: a.id, label: a.name }))}
                  placeholder="All accounts"
                  allLabel="All accounts"
                  searchPlaceholder="Search accounts"
                  className="h-11"
                />
              </div>
            )}
          </div>

          {/* The month grid */}
          <div
            className="rounded-[22px] bg-surface-2 p-3"
            onTouchStart={(e) => {
              touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }}
            onTouchEnd={(e) => {
              const start = touchStart.current;
              touchStart.current = null;
              if (!start) return;
              const dx = e.changedTouches[0].clientX - start.x;
              const dy = e.changedTouches[0].clientY - start.y;
              if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) goTo(addMonths(monthDate, dx < 0 ? 1 : -1));
            }}
          >
            <div className="grid grid-cols-7 pb-1.5">
              {WEEKDAYS.map((d, i) => (
                <span key={i} className="text-center text-[0.6875rem] font-bold uppercase text-text-secondary">
                  {d}
                </span>
              ))}
            </div>
            <div
              key={monthKey}
              className={cn("grid grid-cols-7 gap-1 transition-opacity duration-200", direction === 1 ? "animate-fade-up" : "animate-fade-in", !ready && "animate-pulse opacity-60")}
            >
              {gridDays.map((day) => {
                const inMonth = isSameMonth(day, monthDate);
                if (!inMonth) return <span key={day.toISOString()} className="aspect-[0.86]" aria-hidden="true" />;
                const info = days.get(key(day));
                const isSel = selected && isSameDay(day, selected);
                const heat = info && maxExpense > 0 ? info.expense / maxExpense : 0;
                const dots: string[] = [];
                if (info) {
                  if (info.income > 0) dots.push("bg-income");
                  if (info.hasBill) dots.push(KIND_META.BILL.dot);
                  for (const kind of ["LOAN", "GOAL", "BUDGET", "HOLIDAY"] as const) if (info.items.some((i) => i.kind === kind)) dots.push(KIND_META[kind].dot);
                }
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => setSelected(day)}
                    aria-label={`${format(day, "EEEE, MMMM d")}${info?.expense ? `, spent ${formatMoney(info.expense, currency)}` : ""}`}
                    aria-pressed={!!isSel}
                    className={cn(
                      "relative flex aspect-[0.86] flex-col items-center justify-between rounded-[14px] px-0.5 pb-1 pt-1.5 text-center outline-none transition-[background-color,transform,box-shadow] duration-200 active:scale-95",
                      isSel ? "bg-accent text-text-on-accent shadow-[0_6px_14px_rgba(27,107,51,0.3)]" : "bg-surface text-text-primary hover:bg-surface-3",
                      isToday(day) && !isSel && "ring-2 ring-accent",
                    )}
                    style={!isSel && heat > 0 ? { backgroundColor: `color-mix(in srgb, var(--expense) ${Math.round(8 + heat * 26)}%, var(--surface))` } : undefined}
                  >
                    <span className="text-[0.8125rem] font-bold leading-none">{day.getDate()}</span>
                    <span className="flex h-1.5 items-center gap-0.5">
                      {dots.slice(0, 4).map((c, i) => (
                        <span key={i} className={cn("h-1.5 w-1.5 rounded-full", isSel ? "bg-text-on-accent/80" : c)} />
                      ))}
                    </span>
                    <span className={cn("h-3 text-[0.5625rem] font-semibold leading-3", isSel ? "text-text-on-accent/90" : "text-text-secondary")}>
                      {info && info.expense > 0 ? formatMoney(info.expense, currency, undefined, { compact: true }) : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <ul className="flex flex-wrap gap-x-4 gap-y-1.5 px-1 text-xs text-text-secondary">
            <li className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-income" /> Income
            </li>
            {(Object.keys(KIND_META) as CalendarItem["kind"][]).map((kind) => (
              <li key={kind} className="flex items-center gap-1.5">
                <span className={cn("h-2 w-2 rounded-full", KIND_META[kind].dot)} /> {KIND_META[kind].label}
              </li>
            ))}
            <li className="flex items-center gap-1.5">
              <span className="h-2 w-5 rounded-full bg-expense/40" /> Spending (darker = more)
            </li>
          </ul>
        </div>

        {/* Coming up */}
        <section className="min-w-0">
          <h2 className="mb-2.5 text-lg font-extrabold tracking-tight text-text-primary">Coming up</h2>
          <p className="-mt-1.5 mb-3 text-xs text-text-secondary">The next 30 days: bills, loans, goal dates and holidays.</p>
          {agenda.length === 0 ? (
            <p className="rounded-[22px] bg-surface-2 px-4 py-8 text-center text-sm text-text-secondary">Nothing coming up in the next 30 days.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {agenda.map((item) => (
                <li key={item.id}>
                  <AgendaRow item={item} currency={currency} onPick={() => (goTo(new Date(item.date)), setSelected(new Date(item.date)))} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* A tapped day */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)} title={selected ? format(selected, "EEEE, MMM d") : "Day"}>
        {selected && (
          <div className="space-y-4 pb-2">
            <div className="flex items-center justify-between rounded-[18px] bg-surface-2 px-4 py-3">
              <span className="text-sm font-semibold text-text-secondary">{selectedInfo && selectedInfo.count > 0 ? "Net for the day" : "Nothing recorded"}</span>
              {selectedInfo && selectedInfo.count > 0 && (
                <span className={cn("text-lg font-extrabold", selectedNet < 0 ? "text-text-primary" : "text-income")}>
                  {formatMoney(selectedNet, currency, undefined, { signDisplay: "exceptZero" })}
                </span>
              )}
            </div>

            {selectedInfo && selectedInfo.items.length > 0 && (
              <div className="space-y-2">
                <p className="text-[0.8125rem] font-bold uppercase tracking-wide text-text-secondary">On this day</p>
                {selectedInfo.items.map((item) => (
                  <AgendaRow key={item.id} item={item} currency={currency} inSheet onNavigate={() => setSelected(null)} />
                ))}
              </div>
            )}

            {selectedInfo && selectedInfo.txs.length > 0 && (
              <div className="space-y-2">
                <p className="text-[0.8125rem] font-bold uppercase tracking-wide text-text-secondary">Transactions</p>
                {selectedInfo.txs.map((tx) => (
                  <TransactionRow key={tx.id} transaction={tx} />
                ))}
              </div>
            )}

            <Button
              type="button"
              size="lg"
              className="w-full"
              onClick={() => {
                const date = key(selected);
                setSelected(null);
                openTransaction({ date });
              }}
            >
              <Plus size={18} strokeWidth={2.5} />
              Add transaction on {format(selected, "MMM d")}
            </Button>
          </div>
        )}
      </Sheet>
    </div>
  );
}

function AgendaRow({
  item,
  currency,
  onPick,
  inSheet,
  onNavigate,
}: {
  item: CalendarItem;
  currency: string;
  onPick?: () => void;
  inSheet?: boolean;
  onNavigate?: () => void;
}) {
  const meta = KIND_META[item.kind];
  const Icon = item.kind === "HOLIDAY" ? Flag : meta.icon;
  const date = new Date(item.date);
  const body = (
    <>
      <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] text-white", meta.dot)}>
        <Icon size={20} strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.9375rem] font-bold text-text-primary">{item.title}</span>
        <span className="block text-xs text-text-secondary">
          {item.kind === "LOAN"
            ? item.direction === "LENT"
              ? "Money to come back"
              : "Repay by"
            : item.kind === "HOLIDAY"
              ? item.holidayKind === "public"
                ? "Public holiday"
                : "Festival"
              : meta.label}
          {item.projected ? " (forecast)" : ""}
          {item.approx ? " · date may shift by a day" : ""}
          {!inSheet ? ` · ${format(date, "EEE, MMM d")}` : ""}
          {item.overdue ? " · overdue" : ""}
        </span>
      </span>
      {item.amount != null && item.kind !== "HOLIDAY" && (
        <span className={cn("shrink-0 text-sm font-extrabold", item.overdue ? "text-expense" : "text-text-primary")}>{formatMoney(item.amount, item.currency ?? currency)}</span>
      )}
    </>
  );
  const className = "flex w-full items-center gap-3 rounded-[18px] bg-surface-2 px-3.5 py-3 text-left transition-colors hover:bg-surface-3";
  if (inSheet && item.href && onNavigate) {
    return (
      <SheetLink href={item.href} onNavigate={onNavigate} className={className}>
        {body}
      </SheetLink>
    );
  }
  return (
    <button type="button" onClick={onPick} className={className}>
      {body}
    </button>
  );
}
