import { requireUserId } from "@/lib/auth-helpers";
import { getCategories } from "@/lib/data/categories";
import { CategoriesView } from "@/components/categories/categories-view";

export default async function CategoriesPage() {
  const userId = await requireUserId();
  const categories = await getCategories(userId, undefined, { includeArchived: true });

  return <CategoriesView categories={categories} />;
}
