import { parse, startOfMonth } from "date-fns";
import { requireUser } from "@/lib/auth-helpers";
import { getCurrentUser } from "@/lib/data/user";
import { getBudgets } from "@/lib/data/budgets";
import { getCategories } from "@/lib/data/categories";
import { BudgetsView } from "@/components/budgets/budgets-view";

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sessionUser = await requireUser();
  const params = await searchParams;
  const user = await getCurrentUser(sessionUser.id);
  const month = params.month ? startOfMonth(parse(params.month, "yyyy-MM", new Date())) : startOfMonth(new Date());

  const [budgets, allBudgets, categories] = await Promise.all([
    getBudgets(sessionUser.id, user.currency, { referenceDate: month }),
    getBudgets(sessionUser.id, user.currency, { referenceDate: month, includeArchived: true }),
    getCategories(sessionUser.id, "EXPENSE"),
  ]);
  // Archived budgets are kept (not deleted), so they get their own list where they can be restored.
  const archivedBudgets = allBudgets.filter((b) => b.isArchived);

  return <BudgetsView budgets={budgets} archivedBudgets={archivedBudgets} categories={categories} currency={user.currency} month={month} />;
}
