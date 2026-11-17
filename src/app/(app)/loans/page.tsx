import { requireUser } from "@/lib/auth-helpers";
import { getCurrentUser } from "@/lib/data/user";
import { getLoans } from "@/lib/data/loans";
import { LoansView } from "@/components/loans/loans-view";

export default async function LoansPage() {
  const sessionUser = await requireUser();
  const userId = sessionUser.id;
  const [user, loans] = await Promise.all([getCurrentUser(userId), getLoans(userId)]);

  return <LoansView loans={loans} currency={user.currency} />;
}
