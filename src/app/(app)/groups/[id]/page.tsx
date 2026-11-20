import { notFound } from "next/navigation";
import { requireUserId } from "@/lib/auth-helpers";
import { getGroup } from "@/lib/data/split";
import { getAccounts } from "@/lib/data/accounts";
import { getCategories } from "@/lib/data/categories";
import { GroupView } from "@/components/groups/group-view";

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id } = await params;
  const [group, accounts, categories] = await Promise.all([getGroup(userId, id), getAccounts(userId), getCategories(userId, "EXPENSE")]);
  if (!group) notFound();
  return (
    <GroupView
      group={group}
      accounts={accounts.map((a) => ({ id: a.id, name: a.name, currency: a.currency, type: a.type }))}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
    />
  );
}
