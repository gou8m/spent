import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { getBudgets } from "@/lib/data/budgets";
import { getCategories } from "@/lib/data/categories";
import { BudgetsView } from "@/components/budgets/budgets-view";

export default async function BudgetsPage() {
  const sessionUser = await requireUser();
  const [user, budgets, categories] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: sessionUser.id }, select: { currency: true } }),
    getBudgets(sessionUser.id),
    getCategories(sessionUser.id, "EXPENSE"),
  ]);

  return <BudgetsView budgets={budgets} categories={categories} currency={user.currency} />;
}
