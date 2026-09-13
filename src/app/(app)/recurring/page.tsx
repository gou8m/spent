import { requireUserId } from "@/lib/auth-helpers";
import { getRecurringTransactions } from "@/lib/data/recurring";
import { getAccounts } from "@/lib/data/accounts";
import { getCategories } from "@/lib/data/categories";
import { RecurringView } from "@/components/recurring/recurring-view";

export default async function RecurringPage() {
  const userId = await requireUserId();
  const [rules, accounts, expenseCategories, incomeCategories] = await Promise.all([
    getRecurringTransactions(userId),
    getAccounts(userId),
    getCategories(userId, "EXPENSE"),
    getCategories(userId, "INCOME"),
  ]);

  return (
    <RecurringView
      rules={rules}
      accounts={accounts}
      expenseCategories={expenseCategories}
      incomeCategories={incomeCategories}
    />
  );
}
