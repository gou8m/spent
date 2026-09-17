import { parseISO, isValid, isSameDay, startOfDay, endOfDay } from "date-fns";
import { prisma } from "@/lib/db";
import { toMinorUnits } from "@/lib/money";
import { parseCsv } from "@/lib/csv";

export interface ImportRow {
  line: number;
  date: Date | null;
  type: "EXPENSE" | "INCOME" | "TRANSFER" | null;
  accountId: string | null;
  accountName: string;
  transferToAccountId: string | null;
  transferToAccountName: string;
  categoryId: string | null;
  title: string;
  note: string;
  amountMinor: number | null;
  transferToAmountMinor: number | null;
  currency: string;
  status: "COMPLETED" | "UPCOMING";
  errors: string[];
  isDuplicate: boolean;
}

const REQUIRED_HEADERS = ["Date", "Type", "Account", "Title", "Amount", "Currency"];
const MAX_ROWS = 2000;

function parseDateCell(value: string): Date | null {
  if (!value) return null;
  const iso = parseISO(value);
  if (isValid(iso)) return iso;
  const fallback = new Date(value);
  return !Number.isNaN(fallback.getTime()) ? fallback : null;
}

export async function analyzeImportCsv(userId: string, csvText: string): Promise<{ rows: ImportRow[]; error?: string }> {
  const table = parseCsv(csvText.trim());
  if (table.length === 0) return { rows: [], error: "The file is empty" };

  const header = table[0].map((h) => h.trim());
  const headerIndex = (name: string) => header.findIndex((h) => h.toLowerCase() === name.toLowerCase());

  const missing = REQUIRED_HEADERS.filter((h) => headerIndex(h) === -1);
  if (missing.length > 0) return { rows: [], error: `Missing required column(s): ${missing.join(", ")}` };

  const col = {
    date: headerIndex("Date"),
    type: headerIndex("Type"),
    account: headerIndex("Account"),
    transferToAccount: headerIndex("TransferToAccount"),
    category: headerIndex("Category"),
    subcategory: headerIndex("Subcategory"),
    title: headerIndex("Title"),
    note: headerIndex("Note"),
    amount: headerIndex("Amount"),
    transferToAmount: headerIndex("TransferToAmount"),
    currency: headerIndex("Currency"),
    status: headerIndex("Status"),
  };

  const dataRows = table.slice(1).filter((r) => r.some((cell) => cell.trim() !== ""));
  if (dataRows.length === 0) return { rows: [], error: "No data rows found" };
  if (dataRows.length > MAX_ROWS) return { rows: [], error: `Too many rows — import at most ${MAX_ROWS} transactions at a time` };

  const [accounts, categories] = await Promise.all([
    prisma.account.findMany({ where: { userId } }),
    prisma.category.findMany({ where: { userId } }),
  ]);
  const findAccount = (name: string) => accounts.find((a) => a.name.toLowerCase() === name.trim().toLowerCase());
  /** With a Subcategory cell present, tries the exact parent→child path first (a
   * Category export always has one), then a bare name match on the subcategory value
   * (in case the parent was renamed since), then falls back to matching Category
   * alone — the pre-hierarchy behavior, so an older export without a Subcategory
   * column still imports exactly as it always did. */
  const findCategory = (name: string, type: string, subcategoryName: string) => {
    const categoryName = name.trim().toLowerCase();
    const subName = subcategoryName.trim().toLowerCase();
    if (subName) {
      const parent = categories.find((c) => c.type === type && !c.parentId && c.name.toLowerCase() === categoryName);
      const child = parent && categories.find((c) => c.type === type && c.parentId === parent.id && c.name.toLowerCase() === subName);
      if (child) return child;
      const bySubName = categories.find((c) => c.type === type && c.name.toLowerCase() === subName);
      if (bySubName) return bySubName;
    }
    return categories.find((c) => c.type === type && c.name.toLowerCase() === categoryName);
  };

  const get = (cells: string[], idx: number) => (idx >= 0 ? (cells[idx] ?? "").trim() : "");

  const parsedDates = dataRows.map((cells) => parseDateCell(get(cells, col.date))).filter((d): d is Date => d !== null);
  const existing =
    parsedDates.length > 0
      ? await prisma.transaction.findMany({
          where: {
            userId,
            date: {
              gte: startOfDay(new Date(Math.min(...parsedDates.map((d) => d.getTime())))),
              lte: endOfDay(new Date(Math.max(...parsedDates.map((d) => d.getTime())))),
            },
          },
          select: { accountId: true, date: true, amount: true, title: true },
        })
      : [];

  const rows: ImportRow[] = dataRows.map((cells, i) => {
    const errors: string[] = [];

    const date = parseDateCell(get(cells, col.date));
    if (!date) errors.push("Invalid date (expected yyyy-MM-dd)");

    const typeRaw = get(cells, col.type).toUpperCase();
    const type = (["EXPENSE", "INCOME", "TRANSFER"].includes(typeRaw) ? typeRaw : null) as ImportRow["type"];
    if (!type) errors.push("Type must be EXPENSE, INCOME, or TRANSFER");

    const accountName = get(cells, col.account);
    const account = findAccount(accountName);
    if (!account) errors.push(`Unknown account "${accountName}"`);

    const transferToAccountName = get(cells, col.transferToAccount);
    let transferToAccount: ReturnType<typeof findAccount>;
    if (type === "TRANSFER") {
      if (!transferToAccountName) errors.push("TransferToAccount is required for TRANSFER rows");
      else {
        transferToAccount = findAccount(transferToAccountName);
        if (!transferToAccount) errors.push(`Unknown transfer-to account "${transferToAccountName}"`);
      }
    }

    const categoryName = get(cells, col.category);
    const category = categoryName && type && type !== "TRANSFER" ? findCategory(categoryName, type, get(cells, col.subcategory)) : undefined;

    const title = get(cells, col.title);
    if (!title) errors.push("Title is required");

    const currencyRaw = get(cells, col.currency).toUpperCase();
    if (account && currencyRaw && currencyRaw !== account.currency) {
      errors.push(`Currency ${currencyRaw} doesn't match ${account.name}'s currency (${account.currency})`);
    }

    const amountRaw = get(cells, col.amount);
    const amountNumber = Number(amountRaw);
    let amountMinor: number | null = null;
    if (!amountRaw || Number.isNaN(amountNumber) || amountNumber <= 0) {
      errors.push("Amount must be a positive number");
    } else if (account) {
      amountMinor = toMinorUnits(amountNumber, account.currency);
    }

    let transferToAmountMinor: number | null = null;
    const transferToAmountRaw = get(cells, col.transferToAmount);
    if (transferToAmountRaw && transferToAccount) {
      const n = Number(transferToAmountRaw);
      if (Number.isNaN(n) || n <= 0) errors.push("TransferToAmount must be a positive number");
      else transferToAmountMinor = toMinorUnits(n, transferToAccount.currency);
    }

    const statusRaw = get(cells, col.status).toUpperCase();
    const status: ImportRow["status"] = statusRaw === "UPCOMING" ? "UPCOMING" : "COMPLETED";

    const isDuplicate =
      !!account &&
      !!date &&
      amountMinor !== null &&
      !!title &&
      existing.some(
        (e) =>
          e.accountId === account.id &&
          isSameDay(e.date, date) &&
          e.amount === amountMinor &&
          e.title.trim().toLowerCase() === title.toLowerCase(),
      );

    return {
      line: i + 2,
      date,
      type,
      accountId: account?.id ?? null,
      accountName,
      transferToAccountId: transferToAccount?.id ?? null,
      transferToAccountName,
      categoryId: category?.id ?? null,
      title,
      note: get(cells, col.note),
      amountMinor,
      transferToAmountMinor,
      currency: account?.currency ?? currencyRaw,
      status,
      errors,
      isDuplicate,
    };
  });

  return { rows };
}
