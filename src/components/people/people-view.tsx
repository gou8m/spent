"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { format, differenceInCalendarDays, startOfDay } from "date-fns";
import { BellOff, GitMerge, Pin, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { BackHeader } from "@/components/layout/back-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PartyAvatar } from "@/components/people/party-avatar";
import { PartyTabs } from "@/components/people/party-tabs";
import { mergePartiesAction } from "@/actions/parties";
import { formatMoney } from "@/lib/money";
import { normalizeName } from "@/lib/party";
import { cn } from "@/lib/utils";
import type { MergeSuggestion, PartyListItem } from "@/lib/data/parties";

function Chip({ tone, children }: { tone: "green" | "amber" | "gray"; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex h-5.5 shrink-0 items-center rounded-full px-2 text-[0.6875rem] font-bold",
        tone === "green" && "bg-accent-subtle text-accent-text",
        tone === "amber" && "bg-warning-subtle text-warning",
        tone === "gray" && "bg-surface-3 text-text-secondary",
      )}
    >
      {children}
    </span>
  );
}

function PartyCard({ party, currency, onOpen }: { party: PartyListItem; currency: string; onOpen: () => void }) {
  const isPerson = party.kind === "PERSON";
  const owed = party.owedToYou > 0;
  const owe = party.youOwe > 0;
  const today = startOfDay(new Date());
  const due = party.nextDue ? new Date(party.nextDue) : null;

  const chip = !isPerson ? null : owed && owe ? <Chip tone="amber">Open loans</Chip> : owed ? <Chip tone="green">Lent</Chip> : owe ? <Chip tone="amber">Borrowed</Chip> : <Chip tone="gray">No open loans</Chip>;

  let subtitle: string;
  if (isPerson && party.openLoanCount > 0 && due) {
    const days = differenceInCalendarDays(due, today);
    subtitle = party.overdue ? `Overdue since ${format(due, "MMM d")}` : `${owe && !owed ? "Repay" : "Return"} by ${format(due, "MMM d")}`;
    if (!party.overdue && days <= 3) subtitle += days === 0 ? " (today)" : days === 1 ? " (tomorrow)" : ` (in ${days} days)`;
  } else if (!isPerson && party.monthCount > 0) {
    subtitle = `${party.monthCount} ${party.monthCount === 1 ? "payment" : "payments"} this month`;
  } else {
    subtitle = `${party.count} ${party.count === 1 ? "payment" : "payments"}`;
  }
  const extra =
    isPerson && party.giftsGiven > 0
      ? `Gifts and payments: ${formatMoney(party.giftsGiven, currency, undefined, { decimals: 0 })} (not counted)`
      : null;

  return (
    <button type="button" onClick={onOpen} className="flex w-full items-center gap-3.5 rounded-[22px] bg-surface-2 px-4 py-3.5 text-left transition-colors hover:bg-surface-3 active:scale-[0.99]">
      <PartyAvatar name={party.name} keyName={party.key} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-base font-bold text-text-primary">{party.name}</span>
          {chip}
          {party.pinned && <Pin size={12} className="shrink-0 text-text-secondary" aria-label="Pinned" />}
          {party.muted && <BellOff size={12} className="shrink-0 text-text-secondary" aria-label="Reminders muted" />}
        </span>
        <span className={cn("mt-0.5 block text-[0.8125rem]", party.overdue ? "font-semibold text-expense" : "text-text-secondary")}>{subtitle}</span>
        {extra && <span className="mt-0.5 block text-xs text-text-secondary/80">{extra}</span>}
      </span>
      <span className="shrink-0 text-right">
        {isPerson ? (
          owed || owe ? (
            <>
              {owed && (
                <span className="block">
                  <span className="block text-[0.6875rem] font-semibold text-text-secondary">Owes you</span>
                  <span className="block text-[0.9375rem] font-extrabold text-income">{formatMoney(party.owedToYou, currency)}</span>
                </span>
              )}
              {owe && (
                <span className={cn("block", owed && "mt-1")}>
                  <span className="block text-[0.6875rem] font-semibold text-text-secondary">You owe</span>
                  <span className="block text-[0.9375rem] font-extrabold text-expense">{formatMoney(party.youOwe, currency)}</span>
                </span>
              )}
            </>
          ) : (
            <span className="block text-[0.8125rem] font-bold text-text-secondary">Nothing owed</span>
          )
        ) : (
          <>
            <span className="block text-[0.9375rem] font-extrabold text-text-primary">{party.monthSpend > 0 ? formatMoney(-party.monthSpend, currency) : "No spend"}</span>
            <span className="block text-[0.6875rem] font-semibold text-text-secondary">{party.monthSpend > 0 ? "This month" : format(new Date(party.lastDate), "MMM d")}</span>
          </>
        )}
      </span>
    </button>
  );
}

const DISMISSED_KEY = "people-merge-dismissed";
const subscribeNothing = () => () => {};
const readRaw = () => {
  try {
    return localStorage.getItem(DISMISSED_KEY) ?? "[]";
  } catch {
    return "[]";
  }
};

/** Pairs the person said are different people, remembered on this device so the question is not asked again. */
function readDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function PeopleView({ parties, suggestions, currency }: { parties: PartyListItem[]; suggestions: MergeSuggestion[]; currency: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [merging, setMerging] = useState<MergeSuggestion | null>(null);
  const [busy, setBusy] = useState(false);
  const [dismissedNow, setDismissedNow] = useState<string[]>([]);
  const dismissedStored = useSyncExternalStore(subscribeNothing, readRaw, () => "[]");
  const dismissed = useMemo(() => new Set([...(JSON.parse(dismissedStored) as string[]), ...dismissedNow]), [dismissedStored, dismissedNow]);
  const openSuggestions = suggestions.filter((sg) => !dismissed.has(`${sg.aKey}|${sg.bKey}`));

  function keepSeparate(sg: MergeSuggestion) {
    const id = `${sg.aKey}|${sg.bKey}`;
    setDismissedNow((prev) => [...prev, id]);
    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify([...readDismissed(), id]));
    } catch {
      // Private mode: it just asks again next time.
    }
    setMerging(null);
  }

  const q = normalizeName(query);
  const shown = useMemo(() => (q ? parties.filter((p) => p.key.includes(q)) : parties), [parties, q]);
  const pinned = shown.filter((p) => p.pinned);
  const people = shown.filter((p) => !p.pinned && p.kind === "PERSON");
  const shops = shown.filter((p) => !p.pinned && p.kind === "MERCHANT");

  const owedToYou = parties.reduce((n, p) => n + p.owedToYou, 0);
  const youOwe = parties.reduce((n, p) => n + p.youOwe, 0);
  const hasLoans = parties.some((p) => p.openLoanCount > 0);

  const open = (p: PartyListItem) => router.push(`/people/${encodeURIComponent(p.key)}`);

  async function confirmMerge(intoKey: string, fromKey: string) {
    setBusy(true);
    const result = await mergePartiesAction(fromKey, intoKey);
    setBusy(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Merged into one chat");
    setMerging(null);
    router.refresh();
  }

  const section = (title: string, list: PartyListItem[]) =>
    list.length > 0 && (
      <section>
        <h2 className="mb-2.5 text-[0.8125rem] font-bold uppercase tracking-wide text-text-secondary">{title}</h2>
        <div className="flex flex-col gap-2.5">
          {list.map((p) => (
            <PartyCard key={p.key} party={p} currency={currency} onOpen={() => open(p)} />
          ))}
        </div>
      </section>
    );

  return (
    <div className="space-y-4">
      <BackHeader desktopRoot href="/dashboard" title="Transactions" />

      <PartyTabs current="people" />

      <label className="relative block">
        <span className="sr-only">Search people and shops</span>
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people and shops"
          className="h-12 w-full rounded-md bg-surface-2 pl-11 pr-4 text-[0.9375rem] text-text-primary outline-none placeholder:text-text-secondary focus-visible:ring-2 focus-visible:ring-accent"
        />
      </label>

      {hasLoans && !q && (
        <div className="rounded-2xl px-6 py-5 text-hero-text" style={{ background: "var(--hero-gradient)" }}>
          <p className="text-[0.9375rem] font-semibold text-hero-text-secondary">Open loans only</p>
          <p className="mt-1 text-[2rem] font-extrabold leading-tight tracking-[-0.03em]">
            {owedToYou - youOwe >= 0 ? "+" : "-"}
            {formatMoney(Math.abs(owedToYou - youOwe), currency)}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <span className="flex flex-col items-center rounded-2xl bg-white/20 px-3 py-2 dark:bg-black/10">
              <span className="text-[0.6875rem] font-semibold text-hero-text-secondary">Owed to you</span>
              <span className="text-[0.9375rem] font-extrabold">{formatMoney(owedToYou, currency, undefined, { decimals: 0 })}</span>
            </span>
            <span className="flex flex-col items-center rounded-2xl bg-white/20 px-3 py-2 dark:bg-black/10">
              <span className="text-[0.6875rem] font-semibold text-hero-text-secondary">You owe</span>
              <span className="text-[0.9375rem] font-extrabold">{formatMoney(youOwe, currency, undefined, { decimals: 0 })}</span>
            </span>
          </div>
          <p className="mt-3 text-xs font-medium text-hero-text-secondary">Gifts and ordinary payments are listed but never counted as money owed.</p>
        </div>
      )}

      {!q &&
        openSuggestions.map((s) => (
          <button
            key={`${s.aKey}|${s.bKey}`}
            type="button"
            onClick={() => setMerging(s)}
            className="flex w-full items-center gap-3 rounded-[18px] bg-warning-subtle px-4 py-3 text-left"
          >
            <GitMerge size={20} className="shrink-0 text-warning" />
            <span className="min-w-0 flex-1 text-sm font-semibold text-warning">
              &ldquo;{s.aName}&rdquo; and &ldquo;{s.bName}&rdquo; look alike. Same person?
            </span>
            <span className="shrink-0 text-sm font-extrabold text-warning">Review</span>
          </button>
        ))}

      {shown.length === 0 ? (
        <EmptyState
          icon={Users}
          title={q ? "No match" : "Nothing here yet"}
          description={q ? "Try another name." : "Payments that share a name are grouped into one chat, so you can see everything with a person or a shop in one place."}
        />
      ) : (
        <div className="space-y-5">
          {section("Pinned", pinned)}
          {section("People", people)}
          {section("Shops and merchants", shops)}
        </div>
      )}

      <Sheet open={!!merging} onOpenChange={(o) => !o && setMerging(null)} title="Same person?">
        {merging && (
          <MergeChoice
            a={{ key: merging.aKey, name: merging.aName }}
            b={{ key: merging.bKey, name: merging.bName }}
            parties={parties}
            busy={busy}
            onMerge={confirmMerge}
            onCancel={() => keepSeparate(merging)}
          />
        )}
      </Sheet>
    </div>
  );
}

function MergeChoice({
  a,
  b,
  parties,
  busy,
  onMerge,
  onCancel,
}: {
  a: { key: string; name: string };
  b: { key: string; name: string };
  parties: PartyListItem[];
  busy: boolean;
  onMerge: (intoKey: string, fromKey: string) => void;
  onCancel: () => void;
}) {
  // The one with more payments is the natural name to keep.
  const countOf = (k: string) => parties.find((p) => p.key === k)?.count ?? 0;
  const [keep, setKeep] = useState(countOf(a.key) >= countOf(b.key) ? a.key : b.key);
  const into = keep === a.key ? a : b;
  const from = keep === a.key ? b : a;
  return (
    <div className="space-y-3 pb-2">
      <p className="text-sm text-text-secondary">
        Put every payment under one name. Loans and gifts keep their own labels, nothing is renamed, and you can undo it later.
      </p>
      {[a, b].map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={() => setKeep(p.key)}
          aria-pressed={keep === p.key}
          className={cn("flex w-full items-center gap-3 rounded-[18px] px-3.5 py-3 text-left transition-colors", keep === p.key ? "bg-accent-subtle ring-2 ring-accent" : "bg-surface-2")}
        >
          <PartyAvatar name={p.name} keyName={p.key} size={40} />
          <span className="min-w-0 flex-1">
            <span className="block text-[0.9375rem] font-bold text-text-primary">Keep &ldquo;{p.name}&rdquo;</span>
            <span className="block text-xs text-text-secondary">{countOf(p.key)} {countOf(p.key) === 1 ? "payment" : "payments"}</span>
          </span>
          <span className={cn("flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full border-2", keep === p.key ? "border-accent" : "border-border-strong")}>
            {keep === p.key && <span className="h-2.5 w-2.5 rounded-full bg-accent" />}
          </span>
        </button>
      ))}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>
          Keep separate
        </Button>
        <Button type="button" onClick={() => onMerge(into.key, from.key)} loading={busy} loadingText="Merging…">
          Merge
        </Button>
      </div>
    </div>
  );
}

export { MergeChoice };
