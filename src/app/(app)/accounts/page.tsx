import { requireUserId } from "@/lib/auth-helpers";
import { getAccounts } from "@/lib/data/accounts";
import { AccountsView } from "@/components/accounts/accounts-view";

export default async function AccountsPage() {
  const userId = await requireUserId();
  const accounts = await getAccounts(userId, { includeArchived: true });

  return <AccountsView accounts={accounts} />;
}
