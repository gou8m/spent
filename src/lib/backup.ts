import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";

export const BACKUP_VERSION = 1;

/**
 * Full-dataset JSON export — the practical equivalent of "sync" for now (see
 * TODO.md). Deliberately excludes the User row itself (auth fields, avatar,
 * currency, theme) — this is a data backup, not an account transplant;
 * restoring never touches login credentials or account-level settings.
 */
export async function exportUserBackup(userId: string) {
  const [accounts, categories, tags, transactions, budgets, goals, recurring, user] = await Promise.all([
    prisma.account.findMany({ where: { userId } }),
    prisma.category.findMany({ where: { userId } }),
    prisma.tag.findMany({ where: { userId } }),
    prisma.transaction.findMany({ where: { userId }, include: { tags: true } }),
    prisma.budget.findMany({ where: { userId }, include: { categories: true } }),
    prisma.goal.findMany({ where: { userId } }),
    prisma.recurringTransaction.findMany({ where: { userId } }),
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { currency: true } }),
  ]);

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    currency: user.currency,
    accounts: accounts.map((a) => ({
      id: a.id, name: a.name, type: a.type, bankSubtype: a.bankSubtype, currency: a.currency,
      startingBalance: a.startingBalance, creditLimit: a.creditLimit, allowExpense: a.allowExpense,
      icon: a.icon, color: a.color, isArchived: a.isArchived, sortOrder: a.sortOrder,
    })),
    categories: categories.map((c) => ({
      id: c.id, name: c.name, type: c.type, icon: c.icon, color: c.color, isArchived: c.isArchived, sortOrder: c.sortOrder,
    })),
    tags: tags.map((t) => ({ id: t.id, name: t.name, color: t.color })),
    goals: goals.map((g) => ({
      id: g.id, name: g.name, targetAmount: g.targetAmount, currentAmount: g.currentAmount,
      targetDate: g.targetDate, accountId: g.accountId, icon: g.icon, color: g.color, status: g.status,
    })),
    recurring: recurring.map((r) => ({
      id: r.id, accountId: r.accountId, categoryId: r.categoryId, title: r.title, amount: r.amount, currency: r.currency,
      type: r.type, frequency: r.frequency, interval: r.interval, startDate: r.startDate, endDate: r.endDate,
      nextOccurrence: r.nextOccurrence, lastGeneratedAt: r.lastGeneratedAt, isSubscription: r.isSubscription, isActive: r.isActive,
    })),
    transactions: transactions.map((t) => ({
      id: t.id, accountId: t.accountId, transferToAccountId: t.transferToAccountId, categoryId: t.categoryId,
      type: t.type, amount: t.amount, transferToAmount: t.transferToAmount, currency: t.currency, title: t.title,
      note: t.note, date: t.date, status: t.status, recurringTransactionId: t.recurringTransactionId, goalId: t.goalId,
      tagIds: t.tags.map((tt) => tt.tagId),
    })),
    budgets: budgets.map((b) => ({
      id: b.id, name: b.name, amount: b.amount, period: b.period, startDate: b.startDate, endDate: b.endDate,
      rollover: b.rollover, color: b.color, icon: b.icon, isArchived: b.isArchived,
      categories: b.categories.map((bc) => ({ categoryId: bc.categoryId, limit: bc.limit })),
    })),
  };
}

export type BackupData = Awaited<ReturnType<typeof exportUserBackup>>;

export class BackupValidationError extends Error {}

/** Narrow structural check — not a full schema validator, just enough to catch
 * "wrong file" / "corrupted" / "incompatible version" before we start deleting data. */
export function validateBackup(data: unknown): asserts data is BackupData {
  if (typeof data !== "object" || data === null) throw new BackupValidationError("Not a valid backup file");
  const d = data as Record<string, unknown>;
  if (d.version !== BACKUP_VERSION) throw new BackupValidationError(`Unsupported backup version (expected ${BACKUP_VERSION})`);
  for (const key of ["accounts", "categories", "tags", "transactions", "budgets", "goals", "recurring"]) {
    if (!Array.isArray(d[key])) throw new BackupValidationError(`Backup file is missing "${key}"`);
  }
}

/**
 * Wipes the user's entire dataset and replaces it with the backup's contents.
 * Every id is regenerated (plain UUIDs — nothing in the app depends on the id
 * format itself) and cross-references are remapped through old-id → new-id
 * tables built before any insert, so the whole restore can run as ordinary
 * `createMany` batches inside one transaction instead of one row at a time.
 */
export async function restoreUserBackup(userId: string, data: BackupData) {
  const categoryIdMap = new Map(data.categories.map((c) => [c.id, randomUUID()]));
  const accountIdMap = new Map(data.accounts.map((a) => [a.id, randomUUID()]));
  const tagIdMap = new Map(data.tags.map((t) => [t.id, randomUUID()]));
  const goalIdMap = new Map(data.goals.map((g) => [g.id, randomUUID()]));
  const recurringIdMap = new Map(data.recurring.map((r) => [r.id, randomUUID()]));
  const budgetIdMap = new Map(data.budgets.map((b) => [b.id, randomUUID()]));
  const transactionIdMap = new Map(data.transactions.map((t) => [t.id, randomUUID()]));

  const mapAccount = (id: string | null) => (id ? (accountIdMap.get(id) ?? null) : null);
  const mapCategory = (id: string | null) => (id ? (categoryIdMap.get(id) ?? null) : null);

  const transactionTagRows = data.transactions.flatMap((t) =>
    t.tagIds.filter((tagId) => tagIdMap.has(tagId)).map((tagId) => ({
      transactionId: transactionIdMap.get(t.id)!,
      tagId: tagIdMap.get(tagId)!,
    })),
  );

  await prisma.$transaction([
    prisma.transactionTag.deleteMany({ where: { transaction: { userId } } }),
    prisma.transaction.deleteMany({ where: { userId } }),
    prisma.recurringTransaction.deleteMany({ where: { userId } }),
    prisma.budgetCategory.deleteMany({ where: { budget: { userId } } }),
    prisma.budget.deleteMany({ where: { userId } }),
    prisma.goal.deleteMany({ where: { userId } }),
    prisma.account.deleteMany({ where: { userId } }),
    prisma.category.deleteMany({ where: { userId } }),
    prisma.tag.deleteMany({ where: { userId } }),

    prisma.category.createMany({
      data: data.categories.map((c) => ({
        id: categoryIdMap.get(c.id)!, userId, name: c.name, type: c.type, icon: c.icon, color: c.color,
        isArchived: c.isArchived, sortOrder: c.sortOrder,
      })),
    }),
    prisma.account.createMany({
      data: data.accounts.map((a) => ({
        id: accountIdMap.get(a.id)!, userId, name: a.name, type: a.type, bankSubtype: a.bankSubtype, currency: a.currency,
        startingBalance: a.startingBalance, creditLimit: a.creditLimit, allowExpense: a.allowExpense,
        icon: a.icon, color: a.color, isArchived: a.isArchived, sortOrder: a.sortOrder,
      })),
    }),
    prisma.tag.createMany({
      data: data.tags.map((t) => ({ id: tagIdMap.get(t.id)!, userId, name: t.name, color: t.color })),
    }),
    prisma.goal.createMany({
      data: data.goals.map((g) => ({
        id: goalIdMap.get(g.id)!, userId, name: g.name, targetAmount: g.targetAmount, currentAmount: g.currentAmount,
        targetDate: g.targetDate, accountId: mapAccount(g.accountId), icon: g.icon, color: g.color, status: g.status,
      })),
    }),
    prisma.recurringTransaction.createMany({
      data: data.recurring.map((r) => ({
        id: recurringIdMap.get(r.id)!, userId, accountId: mapAccount(r.accountId)!, categoryId: mapCategory(r.categoryId),
        title: r.title, amount: r.amount, currency: r.currency, type: r.type, frequency: r.frequency, interval: r.interval,
        startDate: r.startDate, endDate: r.endDate, nextOccurrence: r.nextOccurrence, lastGeneratedAt: r.lastGeneratedAt,
        isSubscription: r.isSubscription, isActive: r.isActive,
      })),
    }),
    prisma.transaction.createMany({
      data: data.transactions.map((t) => ({
        id: transactionIdMap.get(t.id)!, userId, accountId: mapAccount(t.accountId)!,
        transferToAccountId: mapAccount(t.transferToAccountId), categoryId: mapCategory(t.categoryId),
        type: t.type, amount: t.amount, transferToAmount: t.transferToAmount, currency: t.currency, title: t.title,
        note: t.note, date: t.date, status: t.status,
        recurringTransactionId: t.recurringTransactionId ? (recurringIdMap.get(t.recurringTransactionId) ?? null) : null,
        goalId: t.goalId ? (goalIdMap.get(t.goalId) ?? null) : null,
      })),
    }),
    prisma.transactionTag.createMany({ data: transactionTagRows }),
    prisma.budget.createMany({
      data: data.budgets.map((b) => ({
        id: budgetIdMap.get(b.id)!, userId, name: b.name, amount: b.amount, period: b.period,
        startDate: b.startDate, endDate: b.endDate, rollover: b.rollover, color: b.color, icon: b.icon, isArchived: b.isArchived,
      })),
    }),
    prisma.budgetCategory.createMany({
      data: data.budgets.flatMap((b) =>
        b.categories
          .filter((bc) => categoryIdMap.has(bc.categoryId))
          .map((bc) => ({ budgetId: budgetIdMap.get(b.id)!, categoryId: categoryIdMap.get(bc.categoryId)!, limit: bc.limit })),
      ),
    }),
  ]);

  return {
    accounts: data.accounts.length,
    categories: data.categories.length,
    transactions: data.transactions.length,
    budgets: data.budgets.length,
    goals: data.goals.length,
    recurring: data.recurring.length,
  };
}

/**
 * Wipes the user's entire dataset (accounts, categories, tags, transactions,
 * budgets, goals, recurring rules) without replacing it with anything —
 * "Clear all data", not restore. Never touches the User row itself (login
 * credentials, currency, avatar) — same scope boundary as backup/restore.
 */
export async function clearUserData(userId: string) {
  await prisma.$transaction([
    prisma.transactionTag.deleteMany({ where: { transaction: { userId } } }),
    prisma.transaction.deleteMany({ where: { userId } }),
    prisma.recurringTransaction.deleteMany({ where: { userId } }),
    prisma.budgetCategory.deleteMany({ where: { budget: { userId } } }),
    prisma.budget.deleteMany({ where: { userId } }),
    prisma.goal.deleteMany({ where: { userId } }),
    prisma.account.deleteMany({ where: { userId } }),
    prisma.category.deleteMany({ where: { userId } }),
    prisma.tag.deleteMany({ where: { userId } }),
  ]);
}
