import { requireUser } from "@/lib/auth-helpers";
import { getCurrentUser } from "@/lib/data/user";
import { getAccounts } from "@/lib/data/accounts";
import { AccountsView } from "@/components/accounts/accounts-view";

export default async function AccountsPage() {
  const sessionUser = await requireUser();
  const [user, accounts] = await Promise.all([
    getCurrentUser(sessionUser.id),
    getAccounts(sessionUser.id, { includeArchived: true }),
  ]);

  return <AccountsView accounts={accounts} defaultCurrency={user.currency} />;
}
