import { requireUserId } from "@/lib/auth-helpers";
import { getCurrentUser } from "@/lib/data/user";
import { getGoals } from "@/lib/data/goals";
import { getAccounts } from "@/lib/data/accounts";
import { GoalsView } from "@/components/goals/goals-view";

export default async function GoalsPage() {
  const userId = await requireUserId();
  const user = await getCurrentUser(userId);
  const [goals, accounts] = await Promise.all([
    getGoals(userId, user.currency, { includeArchived: true }),
    getAccounts(userId),
  ]);

  return <GoalsView goals={goals} accounts={accounts.map((a) => ({ id: a.id, name: a.name, currency: a.currency }))} />;
}
