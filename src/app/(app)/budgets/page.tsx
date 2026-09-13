import { requireUser } from "@/lib/auth-helpers";
import { getCurrentUser } from "@/lib/data/user";
import { getBudgets } from "@/lib/data/budgets";
import { getCategories } from "@/lib/data/categories";
import { BudgetsView } from "@/components/budgets/budgets-view";

export default async function BudgetsPage() {
  const sessionUser = await requireUser();
  const [user, budgets, categories] = await Promise.all([
    getCurrentUser(sessionUser.id),
    getBudgets(sessionUser.id),
    getCategories(sessionUser.id, "EXPENSE"),
  ]);

  return <BudgetsView budgets={budgets} categories={categories} currency={user.currency} />;
}
