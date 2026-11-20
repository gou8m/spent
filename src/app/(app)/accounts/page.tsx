import { requireUser } from "@/lib/auth-helpers";
import { getCurrentUser } from "@/lib/data/user";
import { getAccounts } from "@/lib/data/accounts";
import { getGoalReserves } from "@/lib/data/goal-reserves";
import { getMonthlyTrend } from "@/lib/data/reports";
import { getLoans } from "@/lib/data/loans";
import { getLoanRates } from "@/lib/data/loan-rates";
import { convertMinor } from "@/lib/money";
import { AccountsView, type NetWorthSummary } from "@/components/accounts/accounts-view";

export default async function AccountsPage() {
  const sessionUser = await requireUser();
  const [user, accounts] = await Promise.all([
    getCurrentUser(sessionUser.id),
    getAccounts(sessionUser.id, { includeArchived: true }),
  ]);

  const currency = user.currency;
  // Cross-currency accounts are excluded from the headline figures (flagged via
  // `hasOtherCurrency`) rather than converted — same "exclude and flag" convention
  // budgets/reports already use, instead of a live exchange-rate fetch here too.
  const inCurrency = accounts.filter((a) => !a.isArchived && a.currency === currency);
  const assets = inCurrency.filter((a) => a.type !== "CREDIT_CARD").reduce((sum, a) => sum + a.balance, 0);
  const owed = inCurrency.filter((a) => a.type === "CREDIT_CARD").reduce((sum, a) => sum + Math.max(0, -a.balance), 0);
  const hasOtherCurrency = accounts.some((a) => !a.isArchived && a.currency !== currency);

  const emergencyFundAccount = accounts.find((a) => a.isEmergencyFund && !a.isArchived);
  let emergencyFund: NetWorthSummary["emergencyFund"] = null;
  if (emergencyFundAccount) {
    const trend = await getMonthlyTrend(sessionUser.id, emergencyFundAccount.currency, 3);
    const avgExpense = trend.reduce((sum, m) => sum + m.expense, 0) / trend.length;
    if (avgExpense > 0) {
      emergencyFund = { name: emergencyFundAccount.name, months: Math.round(emergencyFundAccount.balance / avgExpense) };
    }
  }

  const netWorth: NetWorthSummary = { assets, owed, total: assets - owed, hasOtherCurrency, emergencyFund };

  const [goalReserves, loans] = await Promise.all([getGoalReserves(sessionUser.id), getLoans(sessionUser.id)]);
  const rates = await getLoanRates(loans.filter((l) => l.state.status === "OPEN"), currency);
  // Loans in other currencies count at today's rate; one with no rate available is left out.
  const openLoans = loans.filter((l) => l.state.status === "OPEN" && (l.currency === currency || rates[l.currency]));
  const worth = (l: (typeof loans)[number]) => convertMinor(l.state.outstanding, l.currency, currency, rates[l.currency] ?? 1);
  const loanSummary = {
    owedToYou: openLoans.filter((l) => l.direction === "LENT").reduce((n, l) => n + worth(l), 0),
    youOwe: openLoans.filter((l) => l.direction === "BORROWED").reduce((n, l) => n + worth(l), 0),
    openCount: loans.filter((l) => l.state.status === "OPEN").length,
    totalCount: loans.length,
  };

  return <AccountsView accounts={accounts} defaultCurrency={currency} netWorth={netWorth} goalReserves={goalReserves} loanSummary={loanSummary} />;
}
