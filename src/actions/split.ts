"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth-helpers";
import { getAvailableBalanceForDebit } from "@/lib/balances";
import { computeBalances, computeShares } from "@/lib/split";
import { dayIndex, latestAllowedDay, toUtcMidnight } from "@/lib/loan-payment";
import { CURRENCIES } from "@/lib/constants";
import { MAX_MINOR_UNITS, formatMoney, toMinorUnits } from "@/lib/money";
import { withinRateLimit, TOO_MANY_ATTEMPTS } from "@/lib/rate-limit";
import { getGroup, type GroupDetail } from "@/lib/data/split";

export interface SplitActionResult {
  error?: string;
  id?: string;
}

const CURRENCY_CODES = CURRENCIES.map((c) => c.code) as [string, ...string[]];
const MAX_MEMBERS = 30;
const MAX_GROUPS = 50;

function revalidateSplit(groupId?: string) {
  revalidatePath("/transactions");
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  revalidatePath("/budgets");
  if (groupId) revalidatePath(`/groups/${groupId}`);
}

const nameSchema = z.string().trim().min(1, "Enter a name").max(40, "Keep the name under 40 characters");

const groupSchema = z.object({
  name: nameSchema,
  currency: z.enum(CURRENCY_CODES),
  members: z.array(nameSchema).max(MAX_MEMBERS - 1, "That is too many people"),
});

/** Names only: nobody else needs Spent. You are added as the first member. */
export async function createGroupAction(input: z.input<typeof groupSchema>): Promise<SplitActionResult> {
  const userId = await requireUserId();
  const parsed = groupSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the details" };
  const { name, currency, members } = parsed.data;
  const lowered = members.map((m) => m.toLowerCase());
  if (new Set(lowered).size !== lowered.length || lowered.includes("you")) return { error: "Each person needs a different name" };
  if (!(await withinRateLimit(`split-group:${userId}`, 30, 3600))) return { error: TOO_MANY_ATTEMPTS };
  if ((await prisma.splitGroup.count({ where: { userId } })) >= MAX_GROUPS) return { error: "You have reached the limit of groups" };

  const group = await prisma.splitGroup.create({
    data: {
      userId,
      name,
      currency,
      members: { create: [{ name: "You", isYou: true }, ...members.map((m) => ({ name: m }))] },
    },
    select: { id: true },
  });
  revalidateSplit();
  return { id: group.id };
}

async function ownGroup(userId: string, groupId: string) {
  return prisma.splitGroup.findFirst({ where: { id: groupId, userId }, include: { members: true } });
}

export async function renameGroupAction(groupId: string, name: string): Promise<SplitActionResult> {
  const userId = await requireUserId();
  const parsed = nameSchema.safeParse(name);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const group = await ownGroup(userId, groupId);
  if (!group) return { error: "Group not found" };
  await prisma.splitGroup.update({ where: { id: groupId }, data: { name: parsed.data } });
  revalidateSplit(groupId);
  return {};
}

export async function setGroupArchivedAction(groupId: string, archived: boolean): Promise<SplitActionResult> {
  const userId = await requireUserId();
  const group = await ownGroup(userId, groupId);
  if (!group) return { error: "Group not found" };
  await prisma.splitGroup.update({ where: { id: groupId }, data: { archivedAt: archived ? new Date() : null } });
  revalidateSplit(groupId);
  return {};
}

/** Only a group with nothing in it can be deleted; one with history is archived instead, so no record disappears. */
export async function deleteGroupAction(groupId: string): Promise<SplitActionResult> {
  const userId = await requireUserId();
  const group = await ownGroup(userId, groupId);
  if (!group) return { error: "Group not found" };
  const used = await prisma.splitExpense.count({ where: { groupId } });
  const settled = await prisma.splitSettlement.count({ where: { groupId } });
  if (used + settled > 0) return { error: "This group has history. Archive it instead." };
  await prisma.splitGroup.delete({ where: { id: groupId } });
  revalidateSplit();
  return {};
}

export async function addMemberAction(groupId: string, name: string): Promise<SplitActionResult> {
  const userId = await requireUserId();
  const parsed = nameSchema.safeParse(name);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const group = await ownGroup(userId, groupId);
  if (!group) return { error: "Group not found" };
  const active = group.members.filter((m) => !m.removedAt);
  if (active.length >= MAX_MEMBERS) return { error: "That is too many people" };
  const lowered = parsed.data.toLowerCase();
  if (lowered === "you" || active.some((m) => m.name.toLowerCase() === lowered)) return { error: "Someone in the group already has that name" };
  const member = await prisma.splitMember.create({ data: { groupId, name: parsed.data }, select: { id: true } });
  revalidateSplit(groupId);
  return { id: member.id };
}

/** A member can leave the group once they are square (nothing owed either way). Their past expenses stay. */
export async function removeMemberAction(groupId: string, memberId: string): Promise<SplitActionResult> {
  const userId = await requireUserId();
  const group = await prisma.splitGroup.findFirst({
    where: { id: groupId, userId },
    include: { members: true, expenses: { where: { deletedAt: null }, include: { shares: true } }, settlements: { where: { deletedAt: null } } },
  });
  if (!group) return { error: "Group not found" };
  const member = group.members.find((m) => m.id === memberId);
  if (!member || member.removedAt) return { error: "Member not found" };
  if (member.isYou) return { error: "You cannot remove yourself" };
  const net = computeBalances(
    group.members.map((m) => m.id),
    group.expenses.map((e) => ({ paidById: e.paidById, total: e.total, shares: e.shares.map((s) => ({ memberId: s.memberId, owed: s.owed })) })),
    group.settlements.map((s) => ({ fromMemberId: s.fromMemberId, toMemberId: s.toMemberId, amount: s.amount })),
  );
  if ((net[memberId] ?? 0) !== 0) return { error: `${member.name} still owes or is owed money. Settle up first.` };
  await prisma.splitMember.update({ where: { id: memberId }, data: { removedAt: new Date() } });
  revalidateSplit(groupId);
  return {};
}

const expenseSchema = z.object({
  groupId: z.string().min(1),
  title: z.string().trim().min(1, "Enter what it was for").max(80, "Keep the title under 80 characters"),
  /** Major units, in the group's currency. Ignored when the expense comes from an existing transaction. */
  amount: z.number().positive("Enter an amount above 0"),
  date: z.coerce.date(),
  paidById: z.string().min(1),
  splitType: z.enum(["EQUAL", "EXACT", "PERCENT", "SHARES"]),
  /** Who is in it. EXACT values are major units; PERCENT and SHARES are as typed. */
  entries: z.array(z.object({ memberId: z.string().min(1), value: z.number().optional() })).min(1, "Choose who is in this"),
  note: z.string().trim().max(200).optional(),
  /** Your own payment of it: the account it came out of, and the category to file your share under. */
  accountId: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  /** Turn a transaction you already saved into a shared expense (its amount becomes the total). */
  fromTransactionId: z.string().min(1).optional(),
});

export type ExpenseInput = z.input<typeof expenseSchema>;

async function resolveExpense(userId: string, d: z.infer<typeof expenseSchema>, editingId?: string) {
  const group = await prisma.splitGroup.findFirst({ where: { id: d.groupId, userId }, include: { members: true } });
  if (!group) return { error: "Group not found" } as const;
  if (group.archivedAt) return { error: "This group is archived" } as const;
  const active = new Map(group.members.filter((m) => !m.removedAt).map((m) => [m.id, m]));
  const you = group.members.find((m) => m.isYou)!;

  if (!active.has(d.paidById)) return { error: "Choose who paid" } as const;
  if (d.entries.some((e) => !active.has(e.memberId))) return { error: "Someone in this is not in the group" } as const;
  if (dayIndex(toUtcMidnight(d.date)) > latestAllowedDay()) return { error: "An expense cannot be dated in the future" } as const;

  let source: { id: string; amount: number; accountId: string } | null = null;
  if (d.fromTransactionId) {
    const tx = await prisma.transaction.findFirst({
      where: { id: d.fromTransactionId, userId, type: "EXPENSE", status: "COMPLETED", loan: null, loanPayments: { none: {} }, extraOut: 0, splitExpense: null },
      select: { id: true, amount: true, accountId: true, currency: true },
    });
    if (!tx) return { error: "That transaction cannot be shared" } as const;
    if (tx.currency !== group.currency) return { error: `This group is in ${group.currency}` } as const;
    if (d.paidById !== you.id) return { error: "A payment from your account was paid by you" } as const;
    source = tx;
  }

  const total = source ? source.amount : toMinorUnits(d.amount, group.currency);
  if (!Number.isFinite(total) || total <= 0) return { error: "Enter an amount above 0" } as const;
  if (total > MAX_MINOR_UNITS) return { error: "Amount is too large" } as const;

  // EXACT values arrive in major units.
  const entries = d.entries.map((e) => ({ memberId: e.memberId, value: d.splitType === "EXACT" && e.value !== undefined ? toMinorUnits(e.value, group.currency) : e.value }));
  const split = computeShares(total, d.splitType, entries, d.paidById);
  if (!split.ok) return { error: split.error } as const;
  const yourShare = split.shares.find((s) => s.memberId === you.id)?.owed ?? 0;

  // Your own payment goes into your accounts only when you paid from one of them.
  const link = source ? { accountId: source.accountId } : d.accountId && d.paidById === you.id ? { accountId: d.accountId } : null;
  let account: { id: string; name: string; type: string; currency: string } | null = null;
  if (link) {
    account = await prisma.account.findFirst({ where: { id: link.accountId, userId }, select: { id: true, name: true, type: true, currency: true } });
    if (!account) return { error: "Account not found" } as const;
    if (account.currency !== group.currency) return { error: `Choose an account in ${group.currency}` } as const;
    if (yourShare <= 0) return { error: "Your share is 0, so this cannot come out of your account. Leave the account out." } as const;
    if (!source) {
      const category = d.categoryId ? await prisma.category.findFirst({ where: { id: d.categoryId, userId, type: "EXPENSE" } }) : null;
      if (!category) return { error: "Choose a category for your share" } as const;
    }
  }
  return { group, you, total, split: split.shares, yourShare, account, source, editingId } as const;
}

async function checkFunds(userId: string, account: { id: string; name: string; type: string }, need: number, currency: string, exclude?: { accountId: string; type: string; amount: number; extraOut: number }) {
  if (account.type === "CREDIT_CARD") return null;
  const available = await getAvailableBalanceForDebit(userId, account.id, exclude);
  return need > available ? `Insufficient balance in "${account.name}". Available ${formatMoney(available, currency)}.` : null;
}

export async function createExpenseAction(input: ExpenseInput): Promise<SplitActionResult> {
  const userId = await requireUserId();
  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the details" };
  const d = parsed.data;
  if (!(await withinRateLimit(`split-expense:${userId}`, 200, 3600))) return { error: TOO_MANY_ATTEMPTS };
  const r = await resolveExpense(userId, d);
  if ("error" in r) return { error: r.error };

  const day = toUtcMidnight(d.date);
  let transactionId: string | null = null;

  if (r.account) {
    if (!r.source) {
      const problem = await checkFunds(userId, r.account, r.total, r.group.currency);
      if (problem) return { error: problem };
    }
    if (r.source) {
      transactionId = r.source.id;
    } else {
      const created = await prisma.transaction.create({
        data: {
          userId,
          accountId: r.account.id,
          categoryId: d.categoryId!,
          type: "EXPENSE",
          amount: r.yourShare,
          extraOut: r.total - r.yourShare,
          currency: r.group.currency,
          title: d.title,
          note: d.note || null,
          date: day,
          status: "COMPLETED",
        },
        select: { id: true },
      });
      transactionId = created.id;
    }
  }

  try {
    const createExpense = prisma.splitExpense.create({
      data: {
        groupId: r.group.id,
        title: d.title,
        date: day,
        total: r.total,
        splitType: d.splitType,
        paidById: d.paidById,
        note: d.note || null,
        transactionId,
        shares: { create: r.split.map((s) => ({ memberId: s.memberId, owed: s.owed, input: d.splitType === "PERCENT" || d.splitType === "SHARES" ? (d.entries.find((e) => e.memberId === s.memberId)?.value ?? null) : null })) },
      },
      select: { id: true },
    });
    // Turning a saved transaction into a shared one changes it in the same step as the expense appears.
    const [expense] = r.source
      ? await prisma.$transaction([createExpense, prisma.transaction.update({ where: { id: r.source.id }, data: { amount: r.yourShare, extraOut: r.total - r.yourShare } })])
      : await prisma.$transaction([createExpense]);
    revalidateSplit(r.group.id);
    return { id: expense.id };
  } catch (error) {
    // Do not leave a payment behind without its expense.
    if (transactionId && !r.source) await prisma.transaction.delete({ where: { id: transactionId } }).catch(() => undefined);
    console.error("[split] could not save the expense:", error);
    return { error: "Could not save this. Try again." };
  }
}

export async function updateExpenseAction(expenseId: string, input: ExpenseInput): Promise<SplitActionResult> {
  const userId = await requireUserId();
  const parsed = expenseSchema.omit({ fromTransactionId: true }).safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the details" };
  const d = parsed.data;
  const existing = await prisma.splitExpense.findFirst({ where: { id: expenseId, deletedAt: null, group: { userId } }, include: { transaction: true } });
  if (!existing || existing.groupId !== d.groupId) return { error: "Expense not found" };

  const linked = existing.transaction;
  // An expense paid from your account stays paid from it: the same account, and you as the payer.
  const r = await resolveExpense(userId, { ...d, accountId: linked ? linked.accountId : undefined, categoryId: linked ? (linked.categoryId ?? undefined) : undefined }, expenseId);
  if ("error" in r) return { error: r.error };
  if (linked && d.paidById !== r.you.id) return { error: "This was paid from your account, so you stay the payer." };
  if (linked && r.account) {
    const problem = await checkFunds(userId, r.account, r.total, r.group.currency, { accountId: linked.accountId, type: "EXPENSE", amount: linked.amount, extraOut: linked.extraOut });
    if (problem) return { error: problem };
  }

  const day = toUtcMidnight(d.date);
  await prisma.$transaction([
    prisma.splitShare.deleteMany({ where: { expenseId } }),
    prisma.splitExpense.update({
      where: { id: expenseId },
      data: {
        title: d.title,
        date: day,
        total: r.total,
        splitType: d.splitType,
        paidById: d.paidById,
        note: d.note || null,
        shares: { create: r.split.map((s) => ({ memberId: s.memberId, owed: s.owed, input: d.splitType === "PERCENT" || d.splitType === "SHARES" ? (d.entries.find((e) => e.memberId === s.memberId)?.value ?? null) : null })) },
      },
    }),
    ...(linked ? [prisma.transaction.update({ where: { id: linked.id }, data: { title: d.title, date: day, note: d.note || null, amount: r.yourShare, extraOut: r.total - r.yourShare } })] : []),
  ]);
  revalidateSplit(d.groupId);
  return {};
}

/** Removes the expense from the group and, when you paid it from an account, the payment too. */
export async function deleteExpenseAction(expenseId: string): Promise<SplitActionResult> {
  const userId = await requireUserId();
  const existing = await prisma.splitExpense.findFirst({ where: { id: expenseId, deletedAt: null, group: { userId } }, select: { id: true, groupId: true, transactionId: true } });
  if (!existing) return { error: "Expense not found" };
  await prisma.$transaction([
    prisma.splitExpense.update({ where: { id: expenseId }, data: { deletedAt: new Date(), transactionId: null } }),
    ...(existing.transactionId ? [prisma.transaction.deleteMany({ where: { id: existing.transactionId, userId } })] : []),
  ]);
  revalidateSplit(existing.groupId);
  return {};
}

const settleSchema = z.object({
  groupId: z.string().min(1),
  fromMemberId: z.string().min(1),
  toMemberId: z.string().min(1),
  amount: z.number().positive("Enter an amount above 0"),
  date: z.coerce.date(),
  note: z.string().trim().max(200).optional(),
});

/** Records that one member paid another (cash, UPI, anything): it lowers what they owe. No account moves. */
export async function createSettlementAction(input: z.input<typeof settleSchema>): Promise<SplitActionResult> {
  const userId = await requireUserId();
  const parsed = settleSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the details" };
  const d = parsed.data;
  const group = await ownGroup(userId, d.groupId);
  if (!group) return { error: "Group not found" };
  if (group.archivedAt) return { error: "This group is archived" };
  if (d.fromMemberId === d.toMemberId) return { error: "Choose two different people" };
  const active = new Set(group.members.filter((m) => !m.removedAt).map((m) => m.id));
  if (!active.has(d.fromMemberId) || !active.has(d.toMemberId)) return { error: "Someone here is not in the group" };
  if (dayIndex(toUtcMidnight(d.date)) > latestAllowedDay()) return { error: "A payment cannot be dated in the future" };
  const amount = toMinorUnits(d.amount, group.currency);
  if (amount <= 0) return { error: "Enter an amount above 0" };
  if (amount > MAX_MINOR_UNITS) return { error: "Amount is too large" };
  if (!(await withinRateLimit(`split-settle:${userId}`, 200, 3600))) return { error: TOO_MANY_ATTEMPTS };

  const s = await prisma.splitSettlement.create({
    data: { groupId: d.groupId, fromMemberId: d.fromMemberId, toMemberId: d.toMemberId, amount, date: toUtcMidnight(d.date), note: d.note || null },
    select: { id: true },
  });
  revalidateSplit(d.groupId);
  return { id: s.id };
}

export async function deleteSettlementAction(settlementId: string): Promise<SplitActionResult> {
  const userId = await requireUserId();
  const existing = await prisma.splitSettlement.findFirst({ where: { id: settlementId, deletedAt: null, group: { userId } }, select: { groupId: true } });
  if (!existing) return { error: "Payment not found" };
  await prisma.splitSettlement.update({ where: { id: settlementId }, data: { deletedAt: new Date() } });
  revalidateSplit(existing.groupId);
  return {};
}

/** What "split with a group" needs for a saved expense: the expense, and your open groups in its currency. */
export async function getSplitContextAction(
  transactionId: string,
): Promise<{ error: string } | { transaction: { id: string; title: string; amount: number; date: Date; currency: string }; groups: GroupDetail[] }> {
  const userId = await requireUserId();
  const tx = await prisma.transaction.findFirst({
    where: { id: transactionId, userId, type: "EXPENSE", status: "COMPLETED", loan: null, loanPayments: { none: {} }, extraOut: 0, splitExpense: null },
    select: { id: true, title: true, amount: true, date: true, currency: true },
  });
  if (!tx) return { error: "This transaction cannot be shared" };
  const rows = await prisma.splitGroup.findMany({ where: { userId, archivedAt: null, currency: tx.currency }, select: { id: true }, orderBy: { createdAt: "desc" } });
  const groups = (await Promise.all(rows.map((r) => getGroup(userId, r.id)))).filter((g): g is GroupDetail => !!g);
  return { transaction: tx, groups };
}
