import { cache } from "react";
import { prisma } from "@/lib/db";
import { computeBalances, simplifyDebts, type SplitType, type Transfer } from "@/lib/split";

export interface GroupMemberView {
  id: string;
  name: string;
  isYou: boolean;
  removed: boolean;
  /** Positive: is owed. Negative: owes. In the group's currency, minor units. */
  net: number;
}

export interface GroupExpenseView {
  id: string;
  title: string;
  date: Date;
  total: number;
  splitType: SplitType;
  paidById: string;
  paidByName: string;
  youPaid: boolean;
  /** What you owe for it (0 when you are not in it). */
  yourShare: number;
  /** Positive: you are owed this much for it. Negative: you owe this much. */
  yourNet: number;
  note: string | null;
  transactionId: string | null;
  shares: { memberId: string; name: string; owed: number; input: number | null }[];
}

export interface GroupSettlementView {
  id: string;
  date: Date;
  amount: number;
  fromMemberId: string;
  fromName: string;
  toMemberId: string;
  toName: string;
  note: string | null;
}

export interface GroupDetail {
  id: string;
  name: string;
  currency: string;
  archived: boolean;
  youId: string;
  members: GroupMemberView[];
  expenses: GroupExpenseView[];
  settlements: GroupSettlementView[];
  /** The fewest payments that settle everyone. */
  transfers: (Transfer & { fromName: string; toName: string })[];
  youNet: number;
  totalSpent: number;
}

export interface GroupListItem {
  id: string;
  name: string;
  currency: string;
  archived: boolean;
  memberNames: string[];
  youNet: number;
  expenseCount: number;
  lastActivity: Date;
}

const include = {
  members: { orderBy: { createdAt: "asc" as const } },
  expenses: { where: { deletedAt: null }, orderBy: [{ date: "desc" as const }, { createdAt: "desc" as const }], include: { shares: true } },
  settlements: { where: { deletedAt: null }, orderBy: [{ date: "desc" as const }, { createdAt: "desc" as const }] },
};

type GroupRow = NonNullable<Awaited<ReturnType<typeof loadGroup>>>;

async function loadGroup(userId: string, id: string) {
  return prisma.splitGroup.findFirst({ where: { id, userId }, include });
}

function build(g: GroupRow): GroupDetail {
  const you = g.members.find((m) => m.isYou)!;
  const nameOf = new Map(g.members.map((m) => [m.id, m.isYou ? "You" : m.name]));
  const net = computeBalances(
    g.members.map((m) => m.id),
    g.expenses.map((e) => ({ paidById: e.paidById, total: e.total, shares: e.shares.map((s) => ({ memberId: s.memberId, owed: s.owed })) })),
    g.settlements.map((s) => ({ fromMemberId: s.fromMemberId, toMemberId: s.toMemberId, amount: s.amount })),
  );
  return {
    id: g.id,
    name: g.name,
    currency: g.currency,
    archived: !!g.archivedAt,
    youId: you.id,
    members: g.members.map((m) => ({ id: m.id, name: m.isYou ? "You" : m.name, isYou: m.isYou, removed: !!m.removedAt, net: net[m.id] ?? 0 })),
    expenses: g.expenses.map((e) => {
      const yourShare = e.shares.find((s) => s.memberId === you.id)?.owed ?? 0;
      const youPaid = e.paidById === you.id;
      return {
        id: e.id,
        title: e.title,
        date: e.date,
        total: e.total,
        splitType: e.splitType as SplitType,
        paidById: e.paidById,
        paidByName: nameOf.get(e.paidById) ?? "Someone",
        youPaid,
        yourShare,
        yourNet: (youPaid ? e.total : 0) - yourShare,
        note: e.note,
        transactionId: e.transactionId,
        shares: e.shares.map((s) => ({ memberId: s.memberId, name: nameOf.get(s.memberId) ?? "Someone", owed: s.owed, input: s.input })),
      };
    }),
    settlements: g.settlements.map((s) => ({
      id: s.id,
      date: s.date,
      amount: s.amount,
      fromMemberId: s.fromMemberId,
      fromName: nameOf.get(s.fromMemberId) ?? "Someone",
      toMemberId: s.toMemberId,
      toName: nameOf.get(s.toMemberId) ?? "Someone",
      note: s.note,
    })),
    transfers: simplifyDebts(net).map((t) => ({ ...t, fromName: nameOf.get(t.from) ?? "Someone", toName: nameOf.get(t.to) ?? "Someone" })),
    youNet: net[you.id] ?? 0,
    totalSpent: g.expenses.reduce((n, e) => n + e.total, 0),
  };
}

/** One group, only if it is yours. */
export const getGroup = cache(async (userId: string, id: string): Promise<GroupDetail | null> => {
  const g = await loadGroup(userId, id);
  return g && g.members.some((m) => m.isYou) ? build(g) : null;
});

export async function getGroups(userId: string): Promise<GroupListItem[]> {
  const groups = await prisma.splitGroup.findMany({ where: { userId }, include, orderBy: { createdAt: "desc" } });
  return groups
    .filter((g) => g.members.some((m) => m.isYou))
    .map((g) => {
      const d = build(g);
      const last = [g.createdAt, ...g.expenses.map((e) => e.date), ...g.settlements.map((s) => s.date)].sort((a, b) => b.getTime() - a.getTime())[0];
      return {
        id: g.id,
        name: g.name,
        currency: g.currency,
        archived: d.archived,
        memberNames: d.members.filter((m) => !m.removed).map((m) => m.name),
        youNet: d.youNet,
        expenseCount: g.expenses.length,
        lastActivity: last,
      };
    })
    .sort((a, b) => Number(a.archived) - Number(b.archived) || b.lastActivity.getTime() - a.lastActivity.getTime());
}
