import { requireUser } from "@/lib/auth-helpers";
import { getCurrentUser } from "@/lib/data/user";
import { getLoans } from "@/lib/data/loans";
import { getLoanRates } from "@/lib/data/loan-rates";
import { LoansView } from "@/components/loans/loans-view";

export default async function LoansPage() {
  const sessionUser = await requireUser();
  const userId = sessionUser.id;
  const [user, loans] = await Promise.all([getCurrentUser(userId), getLoans(userId)]);

  const rates = await getLoanRates(loans.filter((l) => l.state.status === "OPEN"), user.currency);

  return <LoansView loans={loans} currency={user.currency} rates={rates} />;
}
