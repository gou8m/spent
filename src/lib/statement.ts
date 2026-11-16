import { prisma } from "@/lib/db";
import { STATEMENT_ROW_LIMIT } from "@/lib/statement-range";

export { STATEMENT_ROW_LIMIT };

export interface StatementTransaction {
  date: Date;
  title: string;
  type: "EXPENSE" | "INCOME" | "TRANSFER";
  /** Minor units, always positive, in `currency`. */
  amount: number;
  currency: string;
  category: string | null;
  account: string;
  transferTo: string | null;
  note: string | null;
}

export interface StatementData {
  user: { name: string; email: string; currency: string };
  start: Date;
  end: Date;
  generatedAt: Date;
  transactions: StatementTransaction[];
  truncated: boolean;
  /** Totals are in the primary currency only; other-currency rows are counted separately. */
  totals: { income: number; expense: number; net: number; savedPercent: number | null; count: number; otherCurrencyCount: number };
  categories: { name: string; amount: number; percent: number }[];
  accounts: { name: string; currency: string; moneyIn: number; moneyOut: number }[];
}

const TOP_CATEGORIES = 6;

/** Everything a statement shows for [start, end]: completed transactions oldest first,
 * totals and the spending breakdown in the user's primary currency, and per-account
 * money in/out in each account's own currency. A parent category's spend includes its
 * subcategories, the same roll-up reports and budgets use. */
export async function getStatementData(userId: string, start: Date, end: Date): Promise<StatementData> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true, email: true, currency: true } });

  const rows = await prisma.transaction.findMany({
    where: { userId, status: "COMPLETED", date: { gte: start, lte: end } },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    take: STATEMENT_ROW_LIMIT + 1,
    include: {
      account: { select: { name: true } },
      transferToAccount: { select: { name: true, currency: true } },
      category: { select: { name: true, parent: { select: { name: true } } } },
    },
  });
  const truncated = rows.length > STATEMENT_ROW_LIMIT;
  const used = truncated ? rows.slice(0, STATEMENT_ROW_LIMIT) : rows;

  const transactions: StatementTransaction[] = used.map((t) => ({
    date: t.date,
    title: t.title,
    type: t.type as StatementTransaction["type"],
    amount: t.amount,
    currency: t.currency,
    category: t.category ? t.category.name : null,
    account: t.account.name,
    transferTo: t.transferToAccount?.name ?? null,
    note: t.note,
  }));

  let income = 0;
  let expense = 0;
  let otherCurrencyCount = 0;
  const byCategory = new Map<string, number>();
  const byAccount = new Map<string, { name: string; currency: string; moneyIn: number; moneyOut: number }>();
  const account = (name: string, currency: string) => {
    const key = `${name}|${currency}`;
    if (!byAccount.has(key)) byAccount.set(key, { name, currency, moneyIn: 0, moneyOut: 0 });
    return byAccount.get(key)!;
  };

  for (const t of used) {
    const own = account(t.account.name, t.currency);
    if (t.type === "INCOME") own.moneyIn += t.amount;
    else own.moneyOut += t.amount; // expense or the debit side of a transfer
    if (t.type === "TRANSFER" && t.transferToAccount) {
      account(t.transferToAccount.name, t.transferToAccount.currency).moneyIn += t.transferToAmount ?? t.amount;
    }

    if (t.currency !== user.currency) {
      otherCurrencyCount++;
      continue;
    }
    if (t.type === "INCOME") income += t.amount;
    if (t.type === "EXPENSE") {
      expense += t.amount;
      const name = t.category?.parent?.name ?? t.category?.name ?? "Uncategorised";
      byCategory.set(name, (byCategory.get(name) ?? 0) + t.amount);
    }
  }

  const sorted = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, TOP_CATEGORIES);
  const restAmount = sorted.slice(TOP_CATEGORIES).reduce((sum, [, amount]) => sum + amount, 0);
  const categories = [...top, ...(restAmount > 0 ? ([["Other", restAmount]] as [string, number][]) : [])].map(([name, amount]) => ({
    name,
    amount,
    percent: expense > 0 ? (amount / expense) * 100 : 0,
  }));

  return {
    user,
    start,
    end,
    generatedAt: new Date(),
    transactions,
    truncated,
    totals: {
      income,
      expense,
      net: income - expense,
      savedPercent: income > 0 ? Math.round(((income - expense) / income) * 100) : null,
      count: transactions.length,
      otherCurrencyCount,
    },
    categories,
    accounts: [...byAccount.values()].sort((a, b) => b.moneyIn + b.moneyOut - (a.moneyIn + a.moneyOut)),
  };
}
