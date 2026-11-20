import { requireUser } from "@/lib/auth-helpers";
import { getCurrentUser } from "@/lib/data/user";
import { getRecurringTransactions } from "@/lib/data/recurring";
import { getAccounts } from "@/lib/data/accounts";
import { getCategories } from "@/lib/data/categories";
import { RecurringView } from "@/components/recurring/recurring-view";

export default async function RecurringPage() {
  const sessionUser = await requireUser();
  const userId = sessionUser.id;
  const [user, rules, accounts, expenseCategories, incomeCategories] = await Promise.all([
    getCurrentUser(userId),
    getRecurringTransactions(userId),
    getAccounts(userId),
    getCategories(userId, "EXPENSE"),
    getCategories(userId, "INCOME"),
  ]);

  return (
    <RecurringView
      rules={rules}
      currency={user.currency}
      accounts={accounts}
      expenseCategories={expenseCategories}
      incomeCategories={incomeCategories}
    />
  );
}
