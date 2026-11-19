"use client";

import { useState, useEffect, type FormEvent } from "react";
import { addDays, format } from "date-fns";
import { toast } from "sonner";
import { ArrowLeftRight, HandCoins, Gift, Handshake, Repeat, StickyNote, Target, TriangleAlert } from "lucide-react";
import { getBudgetImpactAction, type BudgetImpact } from "@/actions/budgets";
import type { GoalReserve } from "@/lib/data/goal-reserves";
import { transactionSchema } from "@/lib/validations/transaction";
import {
  createTransactionAction,
  updateTransactionAction,
  deleteTransactionAction,
  lookupPayeeCategoryAction,
  type ActionResult,
} from "@/actions/transactions";
import { createRecurringAction } from "@/actions/recurring";
import { getExchangeRateAction } from "@/actions/exchange-rate";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { DatePicker } from "@/components/ui/date-picker";
import { Chip } from "@/components/ui/chip";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { AccountPicker, type AccountOption } from "@/components/transactions/account-picker";
import { CategoryPicker, sortCategoriesByUsage, type CategoryOption } from "@/components/transactions/category-picker";
import type { TagOption } from "@/components/transactions/tag-input";
import { decimalsForCurrency, formatMoney, toMinorUnits } from "@/lib/money";
import { cn } from "@/lib/utils";
import { normalizeName } from "@/lib/party";
import { useOptimisticTransactions } from "@/stores/optimistic-transactions";
import { PromptCard, DetailChips, DetailChip, DetailCard } from "@/components/transactions/add-parts";
import {
  OTHER_TRANSFER_CATEGORY_NAME,
  LOAN_INCOME_CATEGORY_NAME,
  LOAN_REPAYMENT_EXPENSE_CATEGORY_NAME,
  LOAN_REPAYMENT_INCOME_CATEGORY_NAME,
} from "@/lib/constants";
import type { TransactionWithRelations } from "@/lib/data/transactions";
import type { LoanSummary } from "@/lib/data/loans";
import { LoanInterestFields, LoanRepaymentFields, type LoanSettlement } from "@/components/transactions/loan-fields";
import type { InterestPeriod } from "@/lib/loan-math";
import { Reveal } from "@/components/ui/reveal";
import type { getTags } from "@/lib/data/tags";

type TxType = "EXPENSE" | "INCOME" | "TRANSFER";
type OpenLoan = LoanSummary;

const QUICK_CATEGORY_COUNT = 3;

export function TransactionForm({
  accounts,
  expenseCategories,
  incomeCategories,
  openLentLoans,
  openBorrowedLoans,
  defaultType = "EXPENSE",
  defaultAccountId,
  primaryCurrency = "USD",
  editing,
  paidLoans = [],
  defaultRepayLoanId,
  defaultDate,
  party,
  duplicate = false,
  autoFocusAmount = true,
  goalReserves = {},
  onSaved,
  onDiscard,
}: {
  accounts: AccountOption[];
  expenseCategories: CategoryOption[];
  incomeCategories: CategoryOption[];
  /** Loans you lent that still have money outstanding — the "which loan is this
   * repaying" picker on an Income under the Loan Repayment Received category. */
  openLentLoans: OpenLoan[];
  /** Same idea for loans you borrowed, on an Expense under Loan Repayment. */
  openBorrowedLoans: OpenLoan[];
  tags: Awaited<ReturnType<typeof getTags>>;
  defaultType?: TxType;
  defaultAccountId?: string;
  /** Shown as the amount field's currency symbol before an account is chosen (no
   * account selected yet means no currency to derive it from otherwise). */
  primaryCurrency?: string;
  editing?: TransactionWithRelations;
  /** When editing a repayment: the loans it paid, worked out without this payment (they may be settled by now). */
  paidLoans?: OpenLoan[];
  /** Opens as a repayment of this loan (from the Loans page): category and loan are pre-selected. */
  defaultRepayLoanId?: string;
  /** Pre-fills the date ("yyyy-MM-dd"), e.g. when adding from a day on the Calendar. */
  defaultDate?: string;
  /** Opened from a person's or shop's chat: the name is filled in, and for a person the sheet asks the right question. */
  party?: { name: string; person: boolean };
  /** Focus the amount field when the form mounts (raises the keyboard on phones). The sheet
   * turns this off while it is closing, because its content briefly re-renders as an empty
   * form during the exit animation, which used to flash the keyboard open and shut. */
  autoFocusAmount?: boolean;
  /** For each account that goals are saved in: what those goals hold inside it. Powers the "is this
   * for a goal?" question on incoming money and the warning when spending would use goal money. */
  goalReserves?: Record<string, GoalReserve>;
  /** Treats `editing` as a template for a NEW transaction (the Duplicate action): same
   * fields, dated today, with no loan link carried over. */
  duplicate?: boolean;
  onSaved: () => void;
  onDiscard?: () => void;
}) {
  const isEditing = !!editing && !duplicate;
  const loanSource = duplicate ? undefined : editing;

  const [type, setType] = useState<TxType>((editing?.type as TxType) ?? defaultType);
  const [amount, setAmount] = useState(editing ? String(editing.amount / 10 ** decimalsForCurrency(editing.currency)) : "");
  const [accountId, setAccountId] = useState(editing?.accountId ?? defaultAccountId ?? "");
  const [transferToAccountId, setTransferToAccountId] = useState(editing?.transferToAccountId ?? "");
  const [transferToAmount, setTransferToAmount] = useState(
    editing?.transferToAmount
      ? String(editing.transferToAmount / 10 ** decimalsForCurrency(editing.transferToAccount?.currency ?? "USD"))
      : "",
  );
  const [categoryId, setCategoryId] = useState(
    editing?.categoryId ??
      (defaultRepayLoanId
        ? ((defaultType === "INCOME" ? incomeCategories : expenseCategories).find(
            (c) => c.name === (defaultType === "INCOME" ? LOAN_REPAYMENT_INCOME_CATEGORY_NAME : LOAN_REPAYMENT_EXPENSE_CATEGORY_NAME),
          )?.id ?? "")
        : party?.person && defaultType === "EXPENSE"
          ? (expenseCategories.find((c) => c.name === OTHER_TRANSFER_CATEGORY_NAME)?.id ?? "")
          : ""),
  );
  const [title, setTitle] = useState(editing?.title ?? party?.name ?? "");
  const [note, setNote] = useState(editing?.note ?? "");
  const [date, setDate] = useState(defaultDate && !editing ? defaultDate : format((duplicate ? undefined : editing?.date) ?? new Date(), "yyyy-MM-dd"));
  // Paying a person: lending (a loan that is tracked) or a gift / ordinary payment (never counted as owed).
  const [lendChoice, setLendChoice] = useState<"LEND" | "GIFT" | null>(
    loanSource?.loan?.direction === "LENT" ? "LEND" : isEditing && editing?.type === "EXPENSE" && editing.category?.name === OTHER_TRANSFER_CATEGORY_NAME ? "GIFT" : null,
  );
  const isLoan = lendChoice === "LEND";
  const [repayDeclined, setRepayDeclined] = useState(false);
  const [borrowDeclined, setBorrowDeclined] = useState(false);
  const [showNote, setShowNote] = useState(!!editing?.note);
  const [loanDueDate, setLoanDueDate] = useState(loanSource?.loan ? format(loanSource.loan.dueDate, "yyyy-MM-dd") : "");
  const [loanCounterpartyType, setLoanCounterpartyType] = useState<"FRIEND" | "BANK" | "OTHER">(
    (loanSource?.loan?.counterpartyType as "FRIEND" | "BANK" | "OTHER" | null | undefined) ?? "FRIEND",
  );
  const [loanInterestOn, setLoanInterestOn] = useState(!!loanSource?.loan?.interestRate);
  const [loanRate, setLoanRate] = useState(loanSource?.loan?.interestRate ? String(loanSource.loan.interestRate) : "");
  const [loanPeriod, setLoanPeriod] = useState<InterestPeriod>((loanSource?.loan?.interestPeriod as InterestPeriod | null | undefined) ?? "MONTH");
  const [repaysLoanIds, setRepaysLoanIds] = useState<string[]>(
    loanSource?.loanPayments?.map((p) => p.loanId) ?? (defaultRepayLoanId ? [defaultRepayLoanId] : []),
  );
  const [settlement, setSettlement] = useState<LoanSettlement>("KEEP");
  const [repeatMonthly, setRepeatMonthly] = useState(false);
  // Tags are no longer picked in this form; an edited transaction keeps the tags it already has.
  const [selectedTags] = useState<TagOption[]>(editing?.tags?.map((t) => t.tag) ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedAccount = accounts.find((a) => a.id === accountId);

  // "Is this money for a goal?": asked when the account the money lands in has goals saved in it.
  const [forGoal, setForGoal] = useState(!!editing?.goalId && editing.type !== "EXPENSE");
  const [pickedGoalId, setPickedGoalId] = useState(editing?.goalId && editing.type !== "EXPENSE" ? editing.goalId : "");
  const currency = selectedAccount?.currency ?? primaryCurrency;
  const categories = type === "INCOME" ? incomeCategories : expenseCategories;
  const quickCategories = sortCategoriesByUsage(categories).slice(0, QUICK_CATEGORY_COUNT);

  // "Transfer to others" (money leaving to a person outside your own accounts) is
  // just a plain EXPENSE under this category — see OTHER_TRANSFER_CATEGORY_NAME.
  // There's no separate "other transfer" mode anymore: picking this category on a
  // normal Expense is the whole flow, same as any other category.
  const transferCategory = expenseCategories.find((c) => c.name === OTHER_TRANSFER_CATEGORY_NAME);
  const isLendingCategory = type === "EXPENSE" && !!transferCategory && categoryId === transferCategory.id;

  // Lending is still checkbox-driven within that category — not every payment to a
  // person is a loan (a hospital bill isn't). Silently drop a stale checked state
  // once the category changes away, rather than letting it submit unseen. Adjusting
  // state during render (same house pattern TransactionSheet's mode reset uses)
  // instead of an effect avoids an extra render pass.
  const [prevIsLendingCategory, setPrevIsLendingCategory] = useState(isLendingCategory);
  if (isLendingCategory !== prevIsLendingCategory) {
    setPrevIsLendingCategory(isLendingCategory);
    if (!isLendingCategory) setLendChoice(null);
  }

  // Borrowing, on the other hand, IS a category — picking "Loan / Borrowed Money"
  // is itself the "yes this is a loan" signal, so its fields just appear, no
  // separate checkbox to also opt into.
  const loanIncomeCategory = incomeCategories.find((c) => c.name === LOAN_INCOME_CATEGORY_NAME);
  const isBorrowingCategory = type === "INCOME" && !!loanIncomeCategory && categoryId === loanIncomeCategory.id;

  // Repaying an existing loan is its own pair of categories, not a checkbox on a
  // normal expense/income — "This is repayment" needs to say WHICH loan, and the
  // category is what makes that picker appear at all.
  const repayExpenseCategory = expenseCategories.find((c) => c.name === LOAN_REPAYMENT_EXPENSE_CATEGORY_NAME);
  const repayIncomeCategory = incomeCategories.find((c) => c.name === LOAN_REPAYMENT_INCOME_CATEGORY_NAME);
  const isRepayingBorrowed = type === "EXPENSE" && !!repayExpenseCategory && categoryId === repayExpenseCategory.id;
  const isRepayingLent = type === "INCOME" && !!repayIncomeCategory && categoryId === repayIncomeCategory.id;
  const isRepaying = isRepayingBorrowed || isRepayingLent;

  const [prevIsRepaying, setPrevIsRepaying] = useState(isRepaying);
  if (isRepaying !== prevIsRepaying) {
    setPrevIsRepaying(isRepaying);
    if (!isRepaying) setRepaysLoanIds([]);
  }

  // Loans this payment can be applied to: the open ones plus (when editing) the ones it already paid.
  const repayDirection = isRepayingBorrowed ? "BORROWED" : "LENT";
  const repayableLoans = isRepaying
    ? [...(isRepayingBorrowed ? openBorrowedLoans : openLentLoans), ...paidLoans].filter(
        (l, i, all) => all.findIndex((x) => x.id === l.id) === i,
      )
    : [];

  // ---- Who the money is with: one-question prompts, asked only when they matter.
  const nameKey = normalizeName(title);
  const loanNameKey = (l: OpenLoan) => normalizeName(l.title.replace(/ \(carried over\)$/, ""));
  // Open loans with someone of this name: an income from them is probably a repayment (and so is an expense, for money you owe them).
  const repayMatches = (type === "INCOME" ? openLentLoans : type === "EXPENSE" ? openBorrowedLoans : []).filter((l) => nameKey !== "" && loanNameKey(l) === nameKey);
  const showRepayPrompt = !isEditing && !isRepaying && !repayDeclined && repayMatches.length > 0;
  const showLendPrompt = type === "EXPENSE" && isLendingCategory && lendChoice === null && !showRepayPrompt;
  const showBorrowPrompt = type === "INCOME" && !isEditing && !!party?.person && !isRepaying && !isBorrowingCategory && !borrowDeclined && !showRepayPrompt && !!loanIncomeCategory;

  const defaultDue = () => format(addDays(new Date(), 30), "yyyy-MM-dd");
  function startLend() {
    if (transferCategory) setCategoryId(transferCategory.id);
    setLendChoice("LEND");
    if (!loanDueDate) setLoanDueDate(defaultDue());
    setErrors((prev) => ({ ...prev, lendChoice: "" }));
  }
  function chooseGift() {
    if (transferCategory) setCategoryId(transferCategory.id);
    setLendChoice("GIFT");
    setErrors((prev) => ({ ...prev, lendChoice: "" }));
  }
  function startBorrow() {
    if (loanIncomeCategory) setCategoryId(loanIncomeCategory.id);
    if (!loanDueDate) setLoanDueDate(defaultDue());
    setBorrowDeclined(false);
    setErrors((prev) => ({ ...prev, borrowChoice: "" }));
  }
  function startRepay() {
    const category = type === "INCOME" ? repayIncomeCategory : repayExpenseCategory;
    if (!category) return;
    setCategoryId(category.id);
    // Oldest loan first: that is the order the payment is applied in.
    setRepaysLoanIds([...repayMatches].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).map((l) => l.id));
  }
  function undoRepay() {
    setCategoryId("");
    setRepaysLoanIds([]);
    setRepayDeclined(true);
  }

  const destinationAccount = accounts.find((a) => a.id === transferToAccountId);
  const isCrossCurrency = type === "TRANSFER" && !!destinationAccount && destinationAccount.currency !== currency;

  useEffect(() => {
    if (!isCrossCurrency || !destinationAccount) return;
    const amountNum = Number(amount);
    if (!amountNum) return;

    let cancelled = false;
    getExchangeRateAction(currency, destinationAccount.currency).then((rate) => {
      if (cancelled || !rate) return;
      setTransferToAmount(String(Number((amountNum * rate).toFixed(decimalsForCurrency(destinationAccount.currency)))));
    });
    return () => {
      cancelled = true;
    };
  }, [isCrossCurrency, amount, currency, destinationAccount]);

  // Live insufficient-balance warning, computed purely client-side from the account's
  // already-known balance — shown before saving, not just as a toast after a failed
  // submit. Credit cards are exempt (their balance is debt, going further negative is
  // normal) — same exemption the server-side check in actions/transactions.ts applies.
  const amountSize = amount.length > 12 ? "text-2xl" : amount.length > 9 ? "text-3xl" : "text-[3.5rem]";
  const amountMinor = toMinorUnits(Number(amount) || 0, currency);
  const debitsAccount = type === "EXPENSE" || type === "TRANSFER";
  // Editing an old transaction never warns about the balance: every balance is worked out from the
  // full history, so changing a past entry just carries through to everything after it.
  const insufficientBalance =
    !isEditing && debitsAccount && !!selectedAccount && selectedAccount.type !== "CREDIT_CARD" && amountMinor > 0 && amountMinor > selectedAccount.balance;
  // The balance shown already includes the transaction being edited, so take its old effect back out.
  const oldEffect = isEditing && editing && editing.status === "COMPLETED" && editing.accountId === accountId ? (editing.type === "INCOME" ? editing.amount : -editing.amount) : 0;
  const balanceAfter = selectedAccount ? selectedAccount.balance - oldEffect + (type === "INCOME" ? amountMinor : -amountMinor) : null;

  const creditedAccountId = type === "INCOME" ? accountId : type === "TRANSFER" ? transferToAccountId : "";
  const goalChoices = (goalReserves[creditedAccountId]?.goals ?? []).filter((g) => g.status === "ACTIVE" || g.id === editing?.goalId);
  const showGoalPrompt = (type === "INCOME" || type === "TRANSFER") && goalChoices.length > 0;
  const activeGoalId = showGoalPrompt && forGoal ? (goalChoices.some((g) => g.id === pickedGoalId) ? pickedGoalId : goalChoices[0].id) : undefined;

  // Spending from an account that holds goal money: warn (not block) when it would dip into that money.
  const heldForGoals = goalReserves[accountId];
  const ownOldDebit = editing && !duplicate && editing.accountId === accountId && editing.type !== "INCOME" ? editing.amount : 0;
  const freeBalance = selectedAccount ? selectedAccount.balance + ownOldDebit - (heldForGoals?.reserved ?? 0) : 0;
  const dipsIntoGoals =
    debitsAccount && !!selectedAccount && !!heldForGoals && heldForGoals.reserved > 0 && amountMinor > 0 && !insufficientBalance && amountMinor > freeBalance;

  // Live budget warning: asks the server what this expense would do to any budget that
  // covers the chosen category, debounced so typing an amount does not fire a request per digit.
  // Results are stored with the inputs they were computed for, and only shown while those
  // still match the form, so a stale answer never lingers after the inputs change.
  const impactKey = type === "EXPENSE" && categoryId && Number(amount) > 0 ? `${categoryId}|${amount}|${date}|${currency}` : null;
  const [impactResult, setImpactResult] = useState<{ key: string; impacts: BudgetImpact[] } | null>(null);
  useEffect(() => {
    if (!impactKey) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      getBudgetImpactAction({ categoryId, amount: Number(amount), date, currency, excludeTransactionId: editing && !duplicate ? editing.id : undefined })
        .then((impacts) => !cancelled && setImpactResult({ key: impactKey, impacts }))
        .catch(() => !cancelled && setImpactResult({ key: impactKey, impacts: [] }));
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- impactKey already encodes categoryId/amount/date/currency
  }, [impactKey, editing, duplicate]);
  const budgetImpacts = impactKey && impactResult?.key === impactKey ? impactResult.impacts : [];

  // Opened from a shop's chat: the name is known, so guess its usual category straight away.
  useEffect(() => {
    if (!party || party.person || isEditing || categoryId || !title.trim() || type === "TRANSFER") return;
    let cancelled = false;
    void lookupPayeeCategoryAction(title, type).then((result) => {
      if (!cancelled && result.categoryId && categories.some((c) => c.id === result.categoryId)) setCategoryId(result.categoryId);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on opening
  }, []);

  // Payee memory — only when the user hasn't already picked a category (never
  // overrides an explicit choice), and only for types that have one at all.
  async function handleTitleBlur() {
    if (type === "TRANSFER" || categoryId || !title.trim()) return;
    const result = await lookupPayeeCategoryAction(title, type);
    if (result.categoryId && categories.some((c) => c.id === result.categoryId)) {
      setCategoryId(result.categoryId);
    }
  }

  const creditedName = accounts.find((a) => a.id === creditedAccountId)?.name ?? "this account";
  const goalCard = (
    <Reveal show={showGoalPrompt && forGoal}>
      {() => (
      <DetailCard icon={Target} title="For a goal" hint={`It stays in ${creditedName} but is set aside, so it is not spent by mistake.`} onRemove={() => setForGoal(false)} removeLabel="Remove goal">
        <div className="flex flex-wrap gap-2">
          {goalChoices.map((g) => (
            <Chip key={g.id} selected={activeGoalId === g.id} onClick={() => setPickedGoalId(g.id)}>
              {g.name}
            </Chip>
          ))}
        </div>
      </DetailCard>
      )}
    </Reveal>
  );
  const noteCard = (
    <Reveal show={showNote}>
      {() => (
    <DetailCard
      icon={StickyNote}
      title="Note"
      onRemove={() => {
        setNote("");
        setShowNote(false);
      }}
      removeLabel="Remove note"
    >
      <Input id="note" autoFocus={!note} placeholder="Add a detail" value={note} onChange={(e) => setNote(e.target.value)} />
    </DetailCard>
      )}
    </Reveal>
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});

    const interest = loanInterestOn && Number(loanRate) > 0 ? { interestRate: Number(loanRate), interestPeriod: loanPeriod } : {};
    const loan =
      isLendingCategory && isLoan && loanDueDate
        ? { direction: "LENT" as const, dueDate: new Date(loanDueDate), ...interest }
        : isBorrowingCategory && loanDueDate
          ? { direction: "BORROWED" as const, counterpartyType: loanCounterpartyType, dueDate: new Date(loanDueDate), ...interest }
          : undefined;

    const hasOpenLoansToRepay = repayableLoans.length > 0;

    const payload = {
      type,
      amount: Number(amount),
      currency,
      accountId,
      transferToAccountId: type === "TRANSFER" ? transferToAccountId : undefined,
      transferToAmount: isCrossCurrency && transferToAmount ? Number(transferToAmount) : undefined,
      categoryId: type === "TRANSFER" ? undefined : categoryId,
      title: title || (type === "TRANSFER" ? "Transfer" : categories.find((c) => c.id === categoryId)?.name || ""),
      note,
      date: new Date(date),
      status: "COMPLETED" as const,
      tagIds: selectedTags.map((t) => t.id),
      loan,
      repaysLoanIds: isRepaying && repaysLoanIds.length > 0 ? repaysLoanIds : undefined,
      settlement: isRepaying && repaysLoanIds.length > 0 ? settlement : undefined,
      goalId: activeGoalId,
    };

    if (showLendPrompt) {
      setErrors({ lendChoice: "Choose lending or gift" });
      return;
    }
    if (showBorrowPrompt) {
      setErrors({ borrowChoice: "Choose one" });
      return;
    }
    if (isLendingCategory && isLoan && !loanDueDate) {
      setErrors({ loanDueDate: "Choose a return date" });
      return;
    }
    if (isBorrowingCategory && !loanDueDate) {
      setErrors({ loanDueDate: "Choose a repay date" });
      return;
    }
    if ((isLendingCategory && isLoan) || isBorrowingCategory) {
      if (loanInterestOn && !(Number(loanRate) > 0)) {
        setErrors({ loanRate: "Enter the interest rate" });
        return;
      }
    }
    if (isRepaying && hasOpenLoansToRepay && repaysLoanIds.length === 0) {
      setErrors({ repaysLoanIds: "Choose which loans this repays" });
      return;
    }

    const parsed = transactionSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] === "loan" && issue.path[1] === "interestPeriod" ? "loanRate" : (issue.path[0] as string);
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    const result: ActionResult & { id?: string } = isEditing
      ? await updateTransactionAction(editing!.id, parsed.data)
      : await createTransactionAction(parsed.data);

    if (result.error) {
      setIsSubmitting(false);
      toast.error(result.error);
      return;
    }

    // A simple monthly rule — the reference's toggle has no revealed frequency/
    // interval controls of its own, just this one switch, so it always creates a
    // plain "every month, no end date" recurrence starting from this transaction.
    if (repeatMonthly && !isEditing && type !== "TRANSFER" && categoryId) {
      await createRecurringAction({
        title: payload.title,
        amount: payload.amount,
        type,
        accountId,
        categoryId,
        frequency: "MONTHLY",
        interval: 1,
        startDate: payload.date,
        isSubscription: false,
      });
    }

    setIsSubmitting(false);

    // Show it in the lists right away; the refreshed page from the server replaces this a moment later.
    const savedId = isEditing ? editing!.id : result.id;
    if (savedId) {
      const category = type === "TRANSFER" ? null : categories.find((c) => c.id === categoryId);
      const toAccount = type === "TRANSFER" ? accounts.find((a) => a.id === transferToAccountId) : undefined;
      const optimistic = {
        id: savedId,
        userId: "",
        accountId,
        transferToAccountId: type === "TRANSFER" ? transferToAccountId : null,
        categoryId: type === "TRANSFER" ? null : categoryId,
        type,
        amount: amountMinor,
        transferToAmount: null,
        currency,
        title: payload.title,
        note: note || null,
        date: new Date(date),
        status: "COMPLETED",
        recurringTransactionId: null,
        goalId: activeGoalId ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
        repaysLoanId: null,
        account: selectedAccount ? { id: selectedAccount.id, name: selectedAccount.name, type: selectedAccount.type, currency: selectedAccount.currency, icon: selectedAccount.icon, color: selectedAccount.color } : null,
        transferToAccount: toAccount ? { id: toAccount.id, name: toAccount.name, type: toAccount.type, currency: toAccount.currency, icon: toAccount.icon, color: toAccount.color } : null,
        category: category ? { id: category.id, name: category.name, icon: category.icon, color: category.color, type: type === "INCOME" ? "INCOME" : "EXPENSE" } : null,
        tags: editing?.tags ?? [],
        loan: loan ? { id: "pending", direction: loan.direction, dueDate: loan.dueDate, counterpartyType: null, interestRate: null, interestPeriod: null, payments: [] } : null,
        loanPayments: repaysLoanIds.map((loanId) => ({ loanId })),
      } as unknown as TransactionWithRelations;
      if (isEditing) useOptimisticTransactions.getState().edit(optimistic);
      else useOptimisticTransactions.getState().add(optimistic);
    }

    toast.success(isEditing ? "Transaction updated" : "Saved", {
      action:
        !isEditing && result.id
          ? {
              label: "Undo",
              onClick: async () => {
                await deleteTransactionAction(result.id!);
                toast.success("Removed");
              },
            }
          : undefined,
    });
    onSaved();
  }

  const canRepeat = !isEditing && type !== "TRANSFER";
  const canLoan = type !== "TRANSFER" && !isRepaying && (type === "EXPENSE" ? !!transferCategory : !!loanIncomeCategory);
  const loanChipActive = type === "EXPENSE" ? lendChoice === "LEND" : isBorrowingCategory;
  const detailCount = 1 + (canRepeat ? 1 : 0) + (canLoan ? 1 : 0) + (showGoalPrompt ? 1 : 0);

  const saveLabel = isEditing ? "Save changes" : type === "EXPENSE" ? "Save expense" : type === "INCOME" ? "Save income" : "Save transfer";

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-6 pb-4 pt-4">
      <SegmentedControl
        value={type}
        onChange={(v) => {
          setType(v);
          // Paying someone from their chat starts under "Transfer" so the lending question comes up.
          setCategoryId(v === "EXPENSE" && party?.person ? (transferCategory?.id ?? "") : "");
          setLendChoice(null);
          setRepayDeclined(false);
          setBorrowDeclined(false);
          setRepaysLoanIds([]);
        }}
        options={[
          { value: "EXPENSE", label: "Expense" },
          { value: "INCOME", label: "Income" },
          { value: "TRANSFER", label: "Transfer" },
        ]}
      />

      <div className="overflow-hidden rounded-2xl px-6 py-3.5 text-center" style={{ background: "var(--hero-gradient)" }}>
        <p className="text-sm font-semibold text-hero-text-secondary">Amount</p>
        {/* Symbol + digits sit in one centred, content-sized group. The input is stacked on an
            invisible copy of its own text in a single grid cell, so the cell is exactly as wide
            as the typed amount (an input's own `size` leaves blank space after short values,
            which pushed the pair off-centre). */}
        <div className={cn("mx-auto mt-1 flex max-w-full items-center justify-center", amount.length > 9 ? "gap-0.5" : "gap-1")}>
          <span className={cn("shrink-0 font-numeric font-extrabold tracking-[-2px] text-hero-text", amountSize)}>
            {new Intl.NumberFormat("en-US", { style: "currency", currency, currencyDisplay: "narrowSymbol" })
              .formatToParts(0)
              .find((p) => p.type === "currency")?.value ?? currency}
          </span>
          <span className="inline-grid min-w-0 max-w-full">
            <span
              aria-hidden="true"
              className={cn(
                "invisible col-start-1 row-start-1 whitespace-pre font-numeric font-extrabold tracking-[-2px]",
                amountSize,
              )}
            >
              {amount || "0.00"}
            </span>
            <input
              id="amount"
              inputMode="decimal"
              autoComplete="off"
              autoFocus={autoFocusAmount}
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              className={cn(
                "col-start-1 row-start-1 w-0 min-w-full bg-transparent p-0 text-left font-numeric font-extrabold tracking-[-2px] text-hero-text outline-none placeholder:text-hero-text-secondary/60",
                amountSize,
              )}
            />
          </span>
        </div>
        {selectedAccount && type !== "TRANSFER" && (
          <p className="mt-1 text-[0.8125rem] font-semibold text-hero-text-secondary">
            {selectedAccount.name} balance after: {formatMoney(balanceAfter ?? 0, currency)}
          </p>
        )}
        <FieldError>{errors.amount}</FieldError>
      </div>

      {budgetImpacts.map((impact) => {
        const over = impact.overBy > 0;
        return (
          <div
            key={impact.budgetId}
            role="status"
            className={`-mt-2 flex items-start gap-2.5 rounded-md px-4 py-2.5 text-sm font-semibold ${over ? "bg-error-subtle text-error" : "bg-warning-subtle text-warning"}`}
          >
            <TriangleAlert size={18} strokeWidth={2} className="mt-0.5 shrink-0" />
            <span>
              {over
                ? `This puts "${impact.name}" ${formatMoney(impact.overBy, currency)} over budget (${Math.round(impact.percentAfter)}% of ${formatMoney(impact.limit, currency)}).`
                : `This takes "${impact.name}" to ${Math.round(impact.percentAfter)}% — ${formatMoney(impact.limit - impact.spentAfter, currency)} left of ${formatMoney(impact.limit, currency)}.`}
            </span>
          </div>
        );
      })}

      <Reveal show={!!(dipsIntoGoals && heldForGoals)} gap={false} className="-mt-2">
        {() => (
        <div role="status" className="mb-4 flex items-start gap-2.5 rounded-md bg-warning-subtle px-4 py-2.5 text-sm font-semibold text-warning">
          <TriangleAlert size={18} strokeWidth={2} className="mt-0.5 shrink-0" />
          <span>
            {selectedAccount!.name} holds {formatMoney(heldForGoals!.reserved, currency)} for goals ({heldForGoals!.goals.map((g) => g.name).join(", ")}). Only{" "}
            {formatMoney(Math.max(0, freeBalance), currency)} is free, so this would use {formatMoney(amountMinor - Math.max(0, freeBalance), currency)} of goal money.
          </span>
        </div>
        )}
      </Reveal>

      <Reveal show={!!insufficientBalance} gap={false} className="-mt-2">
        {() => (
        <p className="mb-4 rounded-md bg-error-subtle px-4 py-2.5 text-sm font-semibold text-error">
          This would put {selectedAccount!.name} below zero.
        </p>
        )}
      </Reveal>

      <Reveal show={type === "TRANSFER"} gap>
        <div className="space-y-4">
          <div>
            <Label>From</Label>
            <AccountPicker
              accounts={accounts}
              value={accountId}
              onChange={(id) => {
                setAccountId(id);
                setErrors((prev) => (prev.accountId ? { ...prev, accountId: "" } : prev));
              }}
              error={!!errors.accountId}
            />
            <FieldError>{errors.accountId}</FieldError>
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              aria-label="Swap accounts"
              onClick={() => {
                setAccountId(transferToAccountId);
                setTransferToAccountId(accountId);
              }}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-subtle text-accent-hover"
            >
              <ArrowLeftRight size={18} strokeWidth={2} />
            </button>
          </div>

          <div>
            <Label>To</Label>
            <AccountPicker
              accounts={accounts}
              value={transferToAccountId}
              onChange={(id) => {
                setTransferToAccountId(id);
                setErrors((prev) => (prev.transferToAccountId ? { ...prev, transferToAccountId: "" } : prev));
              }}
              exclude={accountId}
              placeholder="Choose destination"
              error={!!errors.transferToAccountId}
            />
            <FieldError>{errors.transferToAccountId}</FieldError>
          </div>

          <Reveal show={isCrossCurrency && !!destinationAccount}>
            {() => (
            <div>
              <Label htmlFor="transferToAmount">Recipient gets</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4.5 top-1/2 -translate-y-1/2 font-numeric text-[0.9375rem] text-text-secondary">
                  {new Intl.NumberFormat("en-US", { style: "currency", currency: destinationAccount!.currency, currencyDisplay: "narrowSymbol" })
                    .formatToParts(0)
                    .find((p) => p.type === "currency")?.value ?? destinationAccount!.currency}
                </span>
                <input
                  id="transferToAmount"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0.00"
                  value={transferToAmount}
                  onChange={(e) => setTransferToAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                  className="h-13 w-full rounded-md bg-surface-2 pl-9 pr-4 font-numeric text-[0.9375rem] text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-accent"
                />
              </div>
              <p className="mt-1.5 text-xs text-text-secondary">Live exchange rate — edit the amount if your bank used a different one.</p>
              <FieldError>{errors.transferToAmount}</FieldError>
            </div>
            )}
          </Reveal>

          <div>
            <Label htmlFor="date">Date</Label>
            <DatePicker value={date} onChange={setDate} />
          </div>

          <DetailChips count={showGoalPrompt ? 2 : 1}>
            <DetailChip icon={StickyNote} label="Note" active={showNote} onClick={() => setShowNote((v) => !v)} />
            {showGoalPrompt && <DetailChip icon={Target} label="Goal" active={forGoal} onClick={() => setForGoal((v) => !v)} />}
          </DetailChips>
          {noteCard}
          {goalCard}
        </div>
      </Reveal>

      <Reveal show={type !== "TRANSFER"}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">{type === "INCOME" ? "Source" : "Merchant"}</Label>
            <Input
              id="title"
              placeholder={isLendingCategory ? "e.g. Rahul, Family, Hospital" : type === "INCOME" ? "e.g. Employer, client" : "e.g. Amazon, Starbucks"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              error={!!errors.title}
            />
            <FieldError>{errors.title}</FieldError>
          </div>

          <Reveal show={showRepayPrompt}>
            {() => (
            <PromptCard
              tone="green"
              icon={HandCoins}
              title={type === "INCOME" ? `Is this ${title.trim()} paying you back?` : `Are you paying back ${title.trim()}?`}
              hint={`${type === "INCOME" ? `${title.trim()} owes you` : `You owe ${title.trim()}`} ${formatMoney(repayMatches.reduce((n, l) => n + l.state.outstanding, 0), repayMatches[0].currency)} in total.`}
              primaryLabel="Yes, repayment"
              secondaryLabel={type === "INCOME" ? "No, other income" : "No, other payment"}
              onPrimary={startRepay}
              onSecondary={() => setRepayDeclined(true)}
            />
            )}
          </Reveal>
          <Reveal show={showLendPrompt}>
            {() => (
            <PromptCard
              icon={Handshake}
              title="Paying a person. Do you expect it back?"
              hint="Gifts are never counted as owed."
              primaryLabel="Yes, I'm lending"
              secondaryLabel="Gift or payment"
              onPrimary={startLend}
              onSecondary={chooseGift}
              error={errors.lendChoice}
            />
            )}
          </Reveal>
          <Reveal show={showBorrowPrompt}>
            {() => (
            <PromptCard
              icon={Handshake}
              title="Is this a loan you will repay?"
              hint="Counted as owed until repaid."
              primaryLabel="Yes, I'm borrowing"
              secondaryLabel="No, ordinary income"
              onPrimary={startBorrow}
              onSecondary={() => setBorrowDeclined(true)}
              error={errors.borrowChoice}
            />
            )}
          </Reveal>
          <Reveal show={isLendingCategory && lendChoice === "GIFT"}>
            {() => (
            <DetailCard icon={Gift} title="Gift or payment" hint="Not counted as owed." onRemove={() => setLendChoice(null)} removeLabel="Change" />
            )}
          </Reveal>
          <Reveal show={isLendingCategory && lendChoice === "LEND"}>
            {() => (
            <DetailCard
              tone="green"
              icon={Handshake}
              title={title.trim() ? `Lending to ${title.trim()}` : "Lending"}
              hint="Shown under Accounts and in their chat."
              onRemove={() => setLendChoice(null)}
              removeLabel="Change"
            >
              <div>
                <Label htmlFor="loanDueDate">Return by</Label>
                <DatePicker value={loanDueDate} onChange={setLoanDueDate} />
                <FieldError>{errors.loanDueDate}</FieldError>
              </div>
              <LoanInterestFields
                bare
                borrowed={false}
                enabled={loanInterestOn}
                onEnabledChange={setLoanInterestOn}
                rate={loanRate}
                onRateChange={setLoanRate}
                period={loanPeriod}
                onPeriodChange={setLoanPeriod}
                amountMinor={amountMinor}
                currency={currency}
                errors={errors}
              />
            </DetailCard>
            )}
          </Reveal>
          <Reveal show={isBorrowingCategory}>
            {() => (
            <DetailCard
              tone="green"
              icon={Handshake}
              title={title.trim() ? `Borrowing from ${title.trim()}` : "Borrowing"}
              hint="Counted as owed until repaid."
              onRemove={() => {
                setCategoryId("");
                setBorrowDeclined(true);
              }}
              removeLabel="Not a loan"
            >
              <div className="space-y-3">
                <div>
                  <Label>Borrowed from</Label>
                  <Select value={loanCounterpartyType} onValueChange={(v) => setLoanCounterpartyType(v as "FRIEND" | "BANK" | "OTHER")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FRIEND">Friend</SelectItem>
                      <SelectItem value="BANK">Bank</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="loanDueDate">Repay by</Label>
                  <DatePicker value={loanDueDate} onChange={setLoanDueDate} />
                  <FieldError>{errors.loanDueDate}</FieldError>
                </div>
              </div>
              <LoanInterestFields
                bare
                borrowed
                enabled={loanInterestOn}
                onEnabledChange={setLoanInterestOn}
                rate={loanRate}
                onRateChange={setLoanRate}
                period={loanPeriod}
                onPeriodChange={setLoanPeriod}
                amountMinor={amountMinor}
                currency={currency}
                errors={errors}
              />
            </DetailCard>
            )}
          </Reveal>
          <Reveal show={isRepaying}>
            {() => (
            <DetailCard
              tone="green"
              icon={HandCoins}
              title="Repayment"
              hint="Oldest loan first, interest first."
              onRemove={undoRepay}
              removeLabel="Not a repayment"
            >
              <LoanRepaymentFields
                direction={repayDirection}
                loans={repayableLoans}
                selectedIds={repaysLoanIds}
                onSelectedChange={setRepaysLoanIds}
                amountMinor={amountMinor}
                payDate={new Date(date)}
                currency={currency}
                excludeTransactionId={isEditing ? editing?.id : undefined}
                settlement={settlement}
                onSettlementChange={setSettlement}
                onFillAmount={(major) => setAmount(String(major))}
                error={errors.repaysLoanIds}
              />
            </DetailCard>
            )}
          </Reveal>

          <div>
            <Label>Category</Label>
            {/* Three common categories and "More", in four equal columns so the row is always balanced. */}
            <div className="grid grid-cols-4 gap-2">
              {quickCategories.map((c) => (
                <Chip
                  key={c.id}
                  selected={categoryId === c.id}
                  className="w-full min-w-0 justify-center px-1.5 text-[0.75rem]"
                  onClick={() => {
                    setCategoryId(c.id);
                    setErrors((prev) => (prev.categoryId ? { ...prev, categoryId: "" } : prev));
                  }}
                >
                  <span className="truncate">{c.name}</span>
                </Chip>
              ))}
              <CategoryPicker
                categories={categories}
                value={categoryId}
                onChange={(id) => {
                  setCategoryId(id);
                  setErrors((prev) => (prev.categoryId ? { ...prev, categoryId: "" } : prev));
                }}
                type={type === "INCOME" ? "INCOME" : "EXPENSE"}
                trigger={
                  (() => {
                    const selected = categories.find((c) => c.id === categoryId);
                    const selectedIsQuick = quickCategories.some((c) => c.id === categoryId);
                    return (
                      <Chip
                        selected={!!selected && !selectedIsQuick}
                        dashed={!selected || selectedIsQuick}
                        className="w-full min-w-0 justify-center px-1.5 text-[0.75rem]"
                      >
                        <span className="truncate">{selected && !selectedIsQuick ? selected.name : "More"}</span>
                      </Chip>
                    );
                  })()
                }
              />
            </div>
            <FieldError>{errors.categoryId}</FieldError>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Account</Label>
              <AccountPicker
                accounts={accounts}
                value={accountId}
                onChange={(id) => {
                  setAccountId(id);
                  setErrors((prev) => (prev.accountId ? { ...prev, accountId: "" } : prev));
                }}
                forExpense={type === "EXPENSE"}
                error={!!errors.accountId}
              />
              <FieldError>{errors.accountId}</FieldError>
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <DatePicker value={date} onChange={setDate} />
              <FieldError>{errors.date}</FieldError>
            </div>
          </div>

          <DetailChips count={detailCount}>
            <DetailChip icon={StickyNote} label="Note" active={showNote} onClick={() => setShowNote((v) => !v)} />
            {canRepeat && <DetailChip icon={Repeat} label="Repeat" active={repeatMonthly} onClick={() => setRepeatMonthly((v) => !v)} />}
            {canLoan && (
              <DetailChip
                icon={Handshake}
                label="Loan"
                active={loanChipActive}
                onClick={() => {
                  if (type === "EXPENSE") {
                    if (loanChipActive) setLendChoice(null);
                    else startLend();
                  } else if (loanChipActive) setCategoryId("");
                  else startBorrow();
                }}
              />
            )}
            {showGoalPrompt && <DetailChip icon={Target} label="Goal" active={forGoal} onClick={() => setForGoal((v) => !v)} />}
          </DetailChips>

          {noteCard}
          <Reveal show={repeatMonthly && canRepeat}>
            {() => (
            <DetailCard
              icon={Repeat}
              title="Repeats every month"
              hint={type === "INCOME" ? "Creates a recurring income starting this date" : "Creates a recurring bill starting this date"}
              onRemove={() => setRepeatMonthly(false)}
              removeLabel="Stop repeating"
            />
            )}
          </Reveal>
          {goalCard}
        </div>
      </Reveal>

      </div>

      {/* Pinned under the scrolling fields, so Save is always in reach and never covers anything. */}
      <div className="flex shrink-0 items-center gap-3 border-t border-divider bg-bg px-6 pb-[calc(0.875rem+env(safe-area-inset-bottom))] pt-3">
        {isEditing && onDiscard && (
          <Button type="button" variant="secondary" onClick={onDiscard} disabled={isSubmitting}>
            Discard
          </Button>
        )}
        <Button type="submit" size="lg" className="flex-1" loading={isSubmitting} loadingText="Saving…">
          {saveLabel}
        </Button>
      </div>
    </form>
  );
}
