import { cache } from "react";
import { addDays, endOfMonth, startOfMonth, startOfDay, subMonths } from "date-fns";
import { prisma } from "@/lib/db";
import { getLoans, type LoanSummary } from "@/lib/data/loans";
import { looksLikeSame, normalizeName, PERSON_CATEGORY_NAMES } from "@/lib/party";

export type PartyKind = "PERSON" | "MERCHANT";

/** Just what the chat view needs of a transaction (no heavy relations). */
interface Lean {
  id: string;
  title: string;
  key: string;
  type: "EXPENSE" | "INCOME";
  amount: number;
  currency: string;
  date: Date;
  createdAt: Date;
  status: string;
  note: string | null;
  accountName: string;
  categoryName: string | null;
  loan: { id: string; direction: string } | null;
  loanPayments: { loanId: string }[];
}

const loadLean = cache(async (userId: string): Promise<Lean[]> => {
  const rows = await prisma.transaction.findMany({
    where: { userId, type: { in: ["EXPENSE", "INCOME"] } },
    select: {
      id: true,
      title: true,
      type: true,
      amount: true,
      currency: true,
      date: true,
      createdAt: true,
      status: true,
      note: true,
      account: { select: { name: true } },
      category: { select: { name: true } },
      loan: { select: { id: true, direction: true } },
      loanPayments: { select: { loanId: true } },
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
  return rows
    .map((r) => ({
      id: r.id,
      title: r.title,
      key: normalizeName(r.title),
      type: r.type as "EXPENSE" | "INCOME",
      amount: r.amount,
      currency: r.currency,
      date: r.date,
      createdAt: r.createdAt,
      status: r.status,
      note: r.note,
      accountName: r.account.name,
      categoryName: r.category?.name ?? null,
      loan: r.loan,
      loanPayments: r.loanPayments,
    }))
    .filter((r) => r.key.length > 0);
});

const loadPrefs = cache(async (userId: string) => {
  const rows = await prisma.party.findMany({ where: { userId } });
  return new Map(rows.map((r) => [r.key, r]));
});

/** Follows "merged into" links to the key a name finally belongs to. */
function resolver(prefs: Awaited<ReturnType<typeof loadPrefs>>) {
  return (key: string) => {
    let current = key;
    for (let hops = 0; hops < 8; hops++) {
      const next = prefs.get(current)?.mergedIntoKey;
      if (!next || next === current) break;
      current = next;
    }
    return current;
  };
}

function mostCommon(titles: string[]): string {
  const counts = new Map<string, number>();
  for (const t of titles) counts.set(t.trim(), (counts.get(t.trim()) ?? 0) + 1);
  // titles arrive newest first, so ties go to the most recent spelling
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
}

/** The party a loan belongs to: by its origin transaction, or for a carried-over balance by its name. */
function loanKey(loan: LoanSummary, keyOfTx: Map<string, string>, canonical: (k: string) => string): string {
  const fromTx = loan.originTransactionId ? keyOfTx.get(loan.originTransactionId) : undefined;
  return canonical(fromTx ?? normalizeName(loan.title.replace(/ \(carried over\)$/, "")));
}

export interface PartyListItem {
  key: string;
  name: string;
  kind: PartyKind;
  pinned: boolean;
  muted: boolean;
  count: number;
  lastDate: string;
  /** Open loans only, in the main currency. Gifts and ordinary payments never count as owed. */
  owedToYou: number;
  youOwe: number;
  openLoanCount: number;
  nextDue: string | null;
  overdue: boolean;
  /** People: money given / received that is not a loan or a repayment. */
  giftsGiven: number;
  otherReceived: number;
  /** Shops: this month's spending and number of payments. */
  monthSpend: number;
  monthCount: number;
}

export interface MergeSuggestion {
  aKey: string;
  aName: string;
  bKey: string;
  bName: string;
}

export async function getParties(userId: string, currency: string) {
  const [lean, prefs, loans] = await Promise.all([loadLean(userId), loadPrefs(userId), getLoans(userId)]);
  const canonical = resolver(prefs);
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());

  const keyOfTx = new Map<string, string>();
  const groups = new Map<string, Lean[]>();
  for (const tx of lean) {
    const key = canonical(tx.key);
    keyOfTx.set(tx.id, key);
    const list = groups.get(key) ?? [];
    list.push(tx);
    groups.set(key, list);
  }
  // A party that only exists through a loan (every transaction deleted) is still listed.
  for (const loan of loans) {
    const key = loanKey(loan, keyOfTx, canonical);
    if (key && !groups.has(key)) groups.set(key, []);
  }

  const items = new Map<string, PartyListItem>();
  for (const [key, txs] of groups) {
    const pref = prefs.get(key);
    const aboutPeople = txs.some((t) => t.loan || t.loanPayments.length > 0 || (t.categoryName && PERSON_CATEGORY_NAMES.has(t.categoryName)));
    const kind: PartyKind = (pref?.kind as PartyKind | null) ?? (aboutPeople ? "PERSON" : "MERCHANT");
    let giftsGiven = 0;
    let otherReceived = 0;
    let monthSpend = 0;
    let monthCount = 0;
    for (const t of txs) {
      if (t.status !== "COMPLETED" || t.currency !== currency) continue;
      const isLoanRelated = !!t.loan || t.loanPayments.length > 0;
      if (t.type === "EXPENSE" && !isLoanRelated) giftsGiven += t.amount;
      if (t.type === "INCOME" && !isLoanRelated) otherReceived += t.amount;
      if (t.type === "EXPENSE" && t.date >= monthStart && t.date <= monthEnd) {
        monthSpend += t.amount;
        monthCount++;
      }
    }
    items.set(key, {
      key,
      name: txs.length > 0 ? mostCommon(txs.map((t) => t.title)) : key,
      kind,
      pinned: !!pref?.pinned,
      muted: !!pref?.muted,
      count: txs.length,
      lastDate: (txs[0]?.date ?? new Date(0)).toISOString(),
      owedToYou: 0,
      youOwe: 0,
      openLoanCount: 0,
      nextDue: null,
      overdue: false,
      giftsGiven,
      otherReceived,
      monthSpend,
      monthCount,
    });
  }

  const today = startOfDay(new Date());
  for (const loan of loans) {
    if (loan.state.status !== "OPEN") continue;
    const item = items.get(loanKey(loan, keyOfTx, canonical));
    if (!item) continue;
    if (item.kind !== "PERSON") item.kind = "PERSON"; // a loan makes it a person
    item.openLoanCount++;
    if (loan.currency === currency) {
      if (loan.direction === "LENT") item.owedToYou += loan.state.outstanding;
      else item.youOwe += loan.state.outstanding;
    }
    const due = new Date(loan.dueDate);
    if (!item.nextDue || due.toISOString() < item.nextDue) item.nextDue = due.toISOString();
    if (startOfDay(due) < today) item.overdue = true;
  }

  const list = [...items.values()].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.lastDate.localeCompare(a.lastDate));

  // Names that look like the same person, offered as a merge (never merged automatically).
  const suggestions: MergeSuggestion[] = [];
  const keys = list.filter((p) => p.count > 0);
  for (let i = 0; i < keys.length && suggestions.length < 3; i++) {
    for (let j = i + 1; j < keys.length && suggestions.length < 3; j++) {
      const a = keys[i];
      const b = keys[j];
      if (a.kind !== "PERSON" && b.kind !== "PERSON") continue;
      if (!looksLikeSame(a.key, b.key)) continue;
      if (prefs.get(a.key)?.kind === "MERCHANT" || prefs.get(b.key)?.kind === "MERCHANT") continue;
      suggestions.push({ aKey: a.key, aName: a.name, bKey: b.key, bName: b.name });
    }
  }

  return { parties: list, suggestions };
}

export type PartyMessageKind = "LOAN_GIVEN" | "LOAN_TAKEN" | "REPAY_IN" | "REPAY_OUT" | "GIVEN" | "RECEIVED";

export interface PartyMessage {
  id: string;
  kind: PartyMessageKind;
  /** OUT: money left you. IN: money came to you. */
  direction: "OUT" | "IN";
  date: string;
  amount: number;
  currency: string;
  status: string;
  note: string | null;
  accountName: string;
  categoryName: string | null;
  title: string;
  /** For a loan given / taken: the loan it created. */
  loan: LoanSummary | null;
  /** For a repayment: how each loan it paid was split between interest and the borrowed amount. */
  splits: { loanId: string; toInterest: number; toPrincipal: number; settled: boolean }[];
}

export async function getPartyThread(userId: string, key: string, currency: string) {
  const [lean, prefs, loans] = await Promise.all([loadLean(userId), loadPrefs(userId), getLoans(userId)]);
  const canonical = resolver(prefs);
  const target = canonical(key);

  const keyOfTx = new Map<string, string>();
  const mine: Lean[] = [];
  for (const tx of lean) {
    const k = canonical(tx.key);
    keyOfTx.set(tx.id, k);
    if (k === target) mine.push(tx);
  }
  const partyLoans = loans.filter((l) => loanKey(l, keyOfTx, canonical) === target);
  const loanById = new Map(partyLoans.map((l) => [l.id, l]));
  if (mine.length === 0 && partyLoans.length === 0 && !prefs.has(target)) return null;

  const pref = prefs.get(target);
  const names = mine.map((t) => t.title);
  // `mine` is newest first; reversing it keeps the order entered within a day when sorting by date below.
  const messages: PartyMessage[] = [...mine]
    .reverse()
    .map((t): PartyMessage => {
      const originLoan = t.loan ? loanById.get(t.loan.id) ?? null : null;
      const splits = t.loanPayments.flatMap((p) => {
        const loan = loanById.get(p.loanId);
        if (!loan) return [];
        const event = loan.state.events.find((e) => e.kind === "PAYMENT" && e.transactionId === t.id);
        if (!event || event.kind !== "PAYMENT") return [];
        return [{ loanId: loan.id, toInterest: event.toInterest, toPrincipal: event.toPrincipal, settled: loan.state.status === "SETTLED" }];
      });
      const kind: PartyMessageKind = t.loan
        ? t.loan.direction === "LENT"
          ? "LOAN_GIVEN"
          : "LOAN_TAKEN"
        : t.loanPayments.length > 0
          ? t.type === "INCOME"
            ? "REPAY_IN"
            : "REPAY_OUT"
          : t.type === "EXPENSE"
            ? "GIVEN"
            : "RECEIVED";
      return {
        id: t.id,
        kind,
        direction: t.type === "EXPENSE" ? "OUT" : "IN",
        date: t.date.toISOString(),
        amount: t.amount,
        currency: t.currency,
        status: t.status,
        note: t.note,
        accountName: t.accountName,
        categoryName: t.categoryName,
        title: t.title,
        loan: originLoan,
        splits,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const aboutPeople = mine.some((t) => t.loan || t.loanPayments.length > 0 || (t.categoryName && PERSON_CATEGORY_NAMES.has(t.categoryName))) || partyLoans.length > 0;
  const kind: PartyKind = (pref?.kind as PartyKind | null) ?? (aboutPeople ? "PERSON" : "MERCHANT");

  const open = partyLoans.filter((l) => l.state.status === "OPEN");
  const inMain = open.filter((l) => l.currency === currency);
  const owedToYou = inMain.filter((l) => l.direction === "LENT").reduce((n, l) => n + l.state.outstanding, 0);
  const youOwe = inMain.filter((l) => l.direction === "BORROWED").reduce((n, l) => n + l.state.outstanding, 0);

  // Shops: this month vs last month, average per payment.
  const now = new Date();
  const thisStart = startOfMonth(now);
  const lastStart = startOfMonth(subMonths(now, 1));
  const spends = mine.filter((t) => t.type === "EXPENSE" && t.status === "COMPLETED" && t.currency === currency);
  const monthSpend = spends.filter((t) => t.date >= thisStart).reduce((n, t) => n + t.amount, 0);
  const monthCount = spends.filter((t) => t.date >= thisStart).length;
  const lastMonthSpend = spends.filter((t) => t.date >= lastStart && t.date < thisStart).reduce((n, t) => n + t.amount, 0);

  // Other names that were merged into this one.
  const mergedNames = [...prefs.values()]
    .filter((p) => p.key !== target && canonical(p.key) === target)
    .map((p) => ({ key: p.key, name: mostCommon(lean.filter((t) => t.key === p.key).map((t) => t.title)) || p.key }));

  const today = startOfDay(now);
  const reminders = open.map((l) => {
    const due = new Date(l.dueDate);
    const remind = addDays(startOfDay(due), -1);
    return {
      loanId: l.id,
      direction: l.direction,
      dueDate: due.toISOString(),
      remindOn: (remind < today ? today : remind).toISOString(),
      overdue: startOfDay(due) < today,
      daysLate: startOfDay(due) < today ? Math.round((today.getTime() - startOfDay(due).getTime()) / 86400000) : 0,
      outstanding: l.state.outstanding,
      currency: l.currency,
    };
  });

  return {
    key: target,
    name: mostCommon(names) || target,
    kind,
    pinned: !!pref?.pinned,
    muted: !!pref?.muted,
    mergedNames,
    currency,
    messages,
    loans: partyLoans,
    summary: {
      owedToYou,
      youOwe,
      principalOutstanding: inMain.reduce((n, l) => n + l.state.principalOutstanding, 0),
      interestOutstanding: inMain.reduce((n, l) => n + l.state.interestOutstanding, 0),
      openLoanCount: open.length,
      interestRate: open.length === 1 ? open[0].interestRate : null,
      interestPeriod: open.length === 1 ? open[0].interestPeriod : null,
      nextDue: open.length ? open.map((l) => l.dueDate).sort()[0] : null,
      monthSpend,
      monthCount,
      lastMonthSpend,
      avgPerPayment: monthCount > 0 ? Math.round(monthSpend / monthCount) : 0,
      count: mine.length,
      since: mine.length ? mine[0].date : null,
    },
    reminders,
  };
}

export type PartyThread = NonNullable<Awaited<ReturnType<typeof getPartyThread>>>;

/** Keys of parties with reminders switched off, including every name merged into them (for the notification bell). */
export async function getMutedPartyKeys(userId: string): Promise<Set<string>> {
  const prefs = await loadPrefs(userId);
  const canonical = resolver(prefs);
  const muted = new Set<string>();
  for (const p of prefs.values()) if (p.muted) muted.add(canonical(p.key));
  return muted;
}

/** The party each of these loans belongs to, in one pass (for reminders: links to the chat, and honouring "mute"). */
export async function loanPartyKeys(userId: string, loans: LoanSummary[]): Promise<Map<string, string>> {
  const [prefs, lean] = await Promise.all([loadPrefs(userId), loadLean(userId)]);
  const canonical = resolver(prefs);
  const keyOfTx = new Map(lean.map((t) => [t.id, canonical(t.key)]));
  return new Map(loans.map((l) => [l.id, loanKey(l, keyOfTx, canonical)]));
}
