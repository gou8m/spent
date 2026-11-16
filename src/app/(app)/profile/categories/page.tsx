import { requireUser } from "@/lib/auth-helpers";
import { getCurrentUser } from "@/lib/data/user";
import { getCategories, getCategoryMonthTotals } from "@/lib/data/categories";
import { CategoriesView } from "@/components/categories/categories-view";

export default async function CategoriesPage() {
  const sessionUser = await requireUser();
  const user = await getCurrentUser(sessionUser.id);
  const [categories, monthTotals] = await Promise.all([
    getCategories(sessionUser.id, undefined, { includeArchived: true }),
    getCategoryMonthTotals(sessionUser.id, user.currency),
  ]);

  return <CategoriesView categories={categories} monthTotals={monthTotals} currency={user.currency} />;
}
