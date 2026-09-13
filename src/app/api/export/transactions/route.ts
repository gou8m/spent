import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth-helpers";
import { stringifyCsv } from "@/lib/csv";
import { toMajorUnits } from "@/lib/money";

const COLUMNS = ["Date", "Type", "Account", "TransferToAccount", "Category", "Title", "Note", "Amount", "TransferToAmount", "Currency", "Status"];

export async function GET() {
  const userId = await requireUserId();

  const transactions = await prisma.transaction.findMany({
    where: { userId },
    include: { account: true, transferToAccount: true, category: true },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  const rows = transactions.map((tx) => [
    format(tx.date, "yyyy-MM-dd"),
    tx.type,
    tx.account.name,
    tx.transferToAccount?.name ?? "",
    tx.category?.name ?? "",
    tx.title,
    tx.note ?? "",
    toMajorUnits(tx.amount, tx.currency).toFixed(2),
    tx.transferToAmount != null && tx.transferToAccount
      ? toMajorUnits(tx.transferToAmount, tx.transferToAccount.currency).toFixed(2)
      : "",
    tx.currency,
    tx.status,
  ]);

  const csv = stringifyCsv([COLUMNS, ...rows]);
  const filename = `spent-transactions-${format(new Date(), "yyyy-MM-dd")}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
