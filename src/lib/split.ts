/**
 * Shared expenses: how a bill is divided, who owes whom, and the fewest payments that settle everyone.
 * Pure functions on integer minor units, used by the server actions and by the add-expense preview.
 * Every split adds up to the total exactly: leftover minor units go to members by a fixed rule
 * (largest fractional part first, ties to whoever paid, then member order).
 */

export type SplitType = "EQUAL" | "EXACT" | "PERCENT" | "SHARES";

export interface SplitEntry {
  memberId: string;
  /** EXACT: minor units. PERCENT: a percent. SHARES: a number of shares. Ignored for EQUAL. */
  value?: number;
}

export type SplitResult = { ok: true; shares: { memberId: string; owed: number }[] } | { ok: false; error: string };

/** Hands out `total` in proportion to `weights`, to whole minor units, adding up exactly. */
function apportion(total: number, weights: number[], order: number[]): number[] {
  const sum = weights.reduce((n, w) => n + w, 0);
  const raw = weights.map((w) => (total * w) / sum);
  const floors = raw.map((r) => Math.floor(r + 1e-9));
  let left = total - floors.reduce((n, f) => n + f, 0);
  const byRemainder = raw
    .map((r, i) => ({ i, frac: r - floors[i] }))
    .sort((a, b) => b.frac - a.frac || order[a.i] - order[b.i]);
  for (const { i } of byRemainder) {
    if (left <= 0) break;
    floors[i] += 1;
    left -= 1;
  }
  return floors;
}

export function computeShares(total: number, type: SplitType, entries: SplitEntry[], paidById?: string): SplitResult {
  if (!Number.isInteger(total) || total <= 0) return { ok: false, error: "Enter an amount above 0" };
  if (entries.length === 0) return { ok: false, error: "Choose who is in this" };
  if (new Set(entries.map((e) => e.memberId)).size !== entries.length) return { ok: false, error: "A member is listed twice" };

  // Ties go to the payer first, then to the order the members were listed in.
  const order = entries.map((e, i) => (e.memberId === paidById ? -1 : i));

  if (type === "EQUAL") {
    const owed = apportion(total, entries.map(() => 1), order);
    return { ok: true, shares: entries.map((e, i) => ({ memberId: e.memberId, owed: owed[i] })) };
  }

  const values = entries.map((e) => e.value ?? 0);
  if (values.some((v) => !Number.isFinite(v) || v < 0)) return { ok: false, error: "Amounts cannot be negative" };

  if (type === "EXACT") {
    if (values.some((v) => !Number.isInteger(v))) return { ok: false, error: "Enter whole amounts" };
    const sum = values.reduce((n, v) => n + v, 0);
    if (sum !== total) return { ok: false, error: sum > total ? "The amounts add up to more than the total" : "The amounts add up to less than the total" };
    return { ok: true, shares: entries.map((e, i) => ({ memberId: e.memberId, owed: values[i] })) };
  }

  if (type === "PERCENT") {
    const sum = values.reduce((n, v) => n + v, 0);
    if (Math.abs(sum - 100) > 0.005) return { ok: false, error: "The percentages must add up to 100" };
    const owed = apportion(total, values, order);
    return { ok: true, shares: entries.map((e, i) => ({ memberId: e.memberId, owed: owed[i] })) };
  }

  // SHARES
  if (values.every((v) => v === 0)) return { ok: false, error: "Give at least one member a share" };
  const owed = apportion(total, values, order);
  return { ok: true, shares: entries.map((e, i) => ({ memberId: e.memberId, owed: owed[i] })) };
}

export interface BalanceExpense {
  paidById: string;
  total: number;
  shares: { memberId: string; owed: number }[];
}
export interface BalanceSettlement {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
}

/** Each member's net: positive means they are owed money, negative means they owe. Adds up to zero. */
export function computeBalances(memberIds: string[], expenses: BalanceExpense[], settlements: BalanceSettlement[]): Record<string, number> {
  const net: Record<string, number> = Object.fromEntries(memberIds.map((id) => [id, 0]));
  const add = (id: string, n: number) => {
    net[id] = (net[id] ?? 0) + n;
  };
  for (const e of expenses) {
    add(e.paidById, e.total);
    for (const s of e.shares) add(s.memberId, -s.owed);
  }
  // Paying someone back raises what you are owed (you owe less) and lowers theirs.
  for (const s of settlements) {
    add(s.fromMemberId, s.amount);
    add(s.toMemberId, -s.amount);
  }
  return net;
}

export interface Transfer {
  from: string;
  to: string;
  amount: number;
}

/** The fewest payments (at most members minus one) that bring everyone to zero. Greedy: biggest debtor pays biggest creditor. */
export function simplifyDebts(net: Record<string, number>): Transfer[] {
  const debtors = Object.entries(net)
    .filter(([, n]) => n < 0)
    .map(([id, n]) => ({ id, n: -n }))
    .sort((a, b) => b.n - a.n || a.id.localeCompare(b.id));
  const creditors = Object.entries(net)
    .filter(([, n]) => n > 0)
    .map(([id, n]) => ({ id, n }))
    .sort((a, b) => b.n - a.n || a.id.localeCompare(b.id));
  const out: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].n, creditors[j].n);
    if (amount > 0) out.push({ from: debtors[i].id, to: creditors[j].id, amount });
    debtors[i].n -= amount;
    creditors[j].n -= amount;
    if (debtors[i].n === 0) i++;
    if (creditors[j].n === 0) j++;
  }
  return out;
}
