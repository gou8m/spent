"use client";

import { useState, useEffect, type FormEvent } from "react";
import { format } from "date-fns";
import { Handshake } from "lucide-react";
import { toast } from "sonner";
import { transactionSchema } from "@/lib/validations/transaction";
import { createTransactionAction, updateTransactionAction, lookupPayeeCategoryAction } from "@/actions/transactions";
import { getExchangeRateAction } from "@/actions/exchange-rate";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { DatePicker } from "@/components/ui/date-picker";
import { AccountPicker, type AccountOption } from "@/components/transactions/account-picker";
import { CategoryPicker, type CategoryOption } from "@/components/transactions/category-picker";
import { decimalsForCurrency } from "@/lib/money";
import { OTHER_TRANSFER_CATEGORY_NAME } from "@/lib/constants";
import type { TransactionWithRelations } from "@/lib/data/transactions";

type TxType = "EXPENSE" | "INCOME" | "TRANSFER";
type TransferMode = "SELF" | "OTHER";

export function TransactionForm({
  accounts,
  expenseCategories,
  incomeCategories,
  defaultType = "EXPENSE",
  defaultAccountId,
  primaryCurrency = "USD",
  editing,
  onSaved,
  onDiscard,
}: {
  accounts: AccountOption[];
  expenseCategories: CategoryOption[];
  incomeCategories: CategoryOption[];
  defaultType?: TxType;
  defaultAccountId?: string;
  /** Shown as the amount field's currency symbol before an account is chosen (no
   * account selected yet means no currency to derive it from otherwise). */
  primaryCurrency?: string;
  editing?: TransactionWithRelations;
  onSaved: () => void;
  onDiscard?: () => void;
}) {
  const isEditing = !!editing;

  const [type, setType] = useState<TxType>((editing?.type as TxType) ?? defaultType);
  const [transferMode, setTransferMode] = useState<TransferMode>("SELF");
  const [amount, setAmount] = useState(editing ? String(editing.amount / 10 ** decimalsForCurrency(editing.currency)) : "");
  const [accountId, setAccountId] = useState(editing?.accountId ?? defaultAccountId ?? "");
  const [transferToAccountId, setTransferToAccountId] = useState(editing?.transferToAccountId ?? "");
  const [transferToAmount, setTransferToAmount] = useState(
    editing?.transferToAmount
      ? String(editing.transferToAmount / 10 ** decimalsForCurrency(editing.transferToAccount?.currency ?? "USD"))
      : "",
  );
  const [categoryId, setCategoryId] = useState(editing?.categoryId ?? "");
  const [title, setTitle] = useState(editing?.title ?? "");
  const [note, setNote] = useState(editing?.note ?? "");
  const [date, setDate] = useState(format(editing?.date ?? new Date(), "yyyy-MM-dd"));
  const [isLoan, setIsLoan] = useState(!!editing?.loan);
  const [loanDueDate, setLoanDueDate] = useState(editing?.loan ? format(editing.loan.dueDate, "yyyy-MM-dd") : "");
  const [loanCounterpartyType, setLoanCounterpartyType] = useState<"FRIEND" | "BANK" | "OTHER">(
    (editing?.loan?.counterpartyType as "FRIEND" | "BANK" | "OTHER" | null | undefined) ?? "FRIEND",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const currency = selectedAccount?.currency ?? primaryCurrency;
  const categories = type === "INCOME" ? incomeCategories : expenseCategories;

  const isOtherTransfer = type === "TRANSFER" && transferMode === "OTHER";
  const otherTransferCategory = expenseCategories.find((c) => c.name === OTHER_TRANSFER_CATEGORY_NAME);

  // Lending only makes sense on money leaving to a person outside your own accounts
  // (an "other transfer" expense); borrowing only makes sense on income. Anywhere
  // else, silently drop a stale checked state rather than letting it submit unseen.
  // Adjusting state during render (same house pattern TransactionSheet's mode reset
  // uses) instead of an effect avoids an extra render pass.
  const loanApplicable = isOtherTransfer || type === "INCOME";
  const [prevLoanApplicable, setPrevLoanApplicable] = useState(loanApplicable);
  if (loanApplicable !== prevLoanApplicable) {
    setPrevLoanApplicable(loanApplicable);
    if (!loanApplicable) setIsLoan(false);
  }

  const destinationAccount = accounts.find((a) => a.id === transferToAccountId);
  const isCrossCurrency = type === "TRANSFER" && transferMode === "SELF" && !!destinationAccount && destinationAccount.currency !== currency;

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

  // Payee memory — only when the user hasn't already picked a category (never
  // overrides an explicit choice), and only for types that have one at all.
  async function handleTitleBlur() {
    if (type === "TRANSFER" || categoryId || !title.trim()) return;
    const result = await lookupPayeeCategoryAction(title, type);
    if (result.categoryId && categories.some((c) => c.id === result.categoryId)) {
      setCategoryId(result.categoryId);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});

    const loan =
      isLoan && loanApplicable && loanDueDate
        ? isOtherTransfer
          ? { direction: "LENT" as const, dueDate: new Date(loanDueDate) }
          : { direction: "BORROWED" as const, counterpartyType: loanCounterpartyType, dueDate: new Date(loanDueDate) }
        : undefined;

    const payload = isOtherTransfer
      ? {
          type: "EXPENSE" as const,
          amount: Number(amount),
          currency,
          accountId,
          transferToAccountId: undefined,
          transferToAmount: undefined,
          categoryId: otherTransferCategory?.id,
          title: title || "Transfer",
          note,
          date: new Date(date),
          status: "COMPLETED" as const,
          tagIds: [] as string[],
          loan,
        }
      : {
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
          tagIds: [] as string[],
          loan,
        };

    if (isLoan && loanApplicable && !loanDueDate) {
      setErrors({ loanDueDate: isOtherTransfer ? "Choose a return date" : "Choose a repay date" });
      return;
    }

    const parsed = transactionSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    const result = isEditing
      ? await updateTransactionAction(editing!.id, parsed.data)
      : await createTransactionAction(parsed.data);
    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(isEditing ? "Transaction updated" : "Transaction added");
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <SegmentedControl
        value={type}
        onChange={(v) => {
          setType(v);
          setCategoryId("");
          setTransferMode("SELF");
        }}
        options={[
          { value: "EXPENSE", label: "Expense" },
          { value: "INCOME", label: "Income" },
          { value: "TRANSFER", label: "Transfer" },
        ]}
      />

      {type === "TRANSFER" && (
        <SegmentedControl
          value={transferMode}
          onChange={setTransferMode}
          options={[
            { value: "SELF", label: "Self transfer" },
            { value: "OTHER", label: "Other transfer" },
          ]}
        />
      )}

      <div>
        <Label htmlFor="amount">Amount</Label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-numeric text-xl text-text-muted">
            {new Intl.NumberFormat("en-US", { style: "currency", currency, currencyDisplay: "narrowSymbol" })
              .formatToParts(0)
              .find((p) => p.type === "currency")?.value ?? currency}
          </span>
          <input
            id="amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            className="h-16 w-full rounded-full bg-surface-2 pl-11 pr-4 font-numeric text-2xl font-semibold text-text-primary outline-none focus-visible:bg-surface focus-visible:ring-2 focus-visible:ring-accent-subtle"
          />
        </div>
        <FieldError>{errors.amount}</FieldError>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>{type === "TRANSFER" ? "From account" : "Account"}</Label>
          <AccountPicker
            accounts={accounts}
            value={accountId}
            onChange={(id) => {
              setAccountId(id);
              setErrors((prev) => (prev.accountId ? { ...prev, accountId: "" } : prev));
            }}
            forExpense={type === "EXPENSE" || isOtherTransfer}
            error={!!errors.accountId}
          />
          <FieldError>{errors.accountId}</FieldError>
        </div>

        {type === "TRANSFER" && transferMode === "SELF" ? (
          <div>
            <Label>To account</Label>
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
        ) : type === "TRANSFER" ? null : (
          <div>
            <Label>Category</Label>
            <CategoryPicker
              categories={categories}
              value={categoryId}
              onChange={(id) => {
                setCategoryId(id);
                setErrors((prev) => (prev.categoryId ? { ...prev, categoryId: "" } : prev));
              }}
              type={type === "INCOME" ? "INCOME" : "EXPENSE"}
              error={!!errors.categoryId}
            />
            <FieldError>{errors.categoryId}</FieldError>
          </div>
        )}
      </div>

      {isCrossCurrency && destinationAccount && (
        <div>
          <Label htmlFor="transferToAmount">{destinationAccount.name} receives</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-numeric text-sm text-text-muted">
              {new Intl.NumberFormat("en-US", { style: "currency", currency: destinationAccount.currency, currencyDisplay: "narrowSymbol" })
                .formatToParts(0)
                .find((p) => p.type === "currency")?.value ?? destinationAccount.currency}
            </span>
            <input
              id="transferToAmount"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              value={transferToAmount}
              onChange={(e) => setTransferToAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              className="h-11 w-full rounded-full bg-surface-2 pl-9 pr-4 font-numeric text-[0.9375rem] text-text-primary outline-none focus-visible:bg-surface focus-visible:ring-2 focus-visible:ring-accent-subtle"
            />
          </div>
          <FieldError>{errors.transferToAmount}</FieldError>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="title">Merchant / Payee</Label>
          <Input
            id="title"
            placeholder={isOtherTransfer ? "e.g. Rahul, Family, Hospital" : type === "TRANSFER" ? "Transfer" : "e.g. Amazon, Starbucks"}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            error={!!errors.title}
          />
          <FieldError>{errors.title}</FieldError>
        </div>
        <div>
          <Label htmlFor="date">Date</Label>
          <DatePicker value={date} onChange={setDate} />
          <FieldError>{errors.date}</FieldError>
        </div>
      </div>

      {loanApplicable && (
        <div className="rounded-2xl bg-surface-2 p-4">
          <label className="flex items-center gap-2.5 text-sm font-medium text-text-primary">
            <input
              type="checkbox"
              checked={isLoan}
              onChange={(e) => setIsLoan(e.target.checked)}
              className="h-4 w-4 rounded border-border-strong accent-accent"
            />
            <Handshake size={16} className="text-text-secondary" />
            {isOtherTransfer ? "This is a loan — I'm lending them this" : "This is a loan — I'm borrowing this"}
          </label>

          {isLoan && (
            <div className={`mt-3 grid gap-3 ${isOtherTransfer ? "grid-cols-1" : "grid-cols-2"}`}>
              {!isOtherTransfer && (
                <div>
                  <Label>Borrowed from</Label>
                  <SegmentedControl
                    value={loanCounterpartyType}
                    onChange={setLoanCounterpartyType}
                    options={[
                      { value: "FRIEND", label: "Friend" },
                      { value: "BANK", label: "Bank" },
                      { value: "OTHER", label: "Other" },
                    ]}
                  />
                </div>
              )}
              <div>
                <Label htmlFor="loanDueDate">{isOtherTransfer ? "They'll return it by" : "Repay by"}</Label>
                <DatePicker value={loanDueDate} onChange={setLoanDueDate} />
                <FieldError>{errors.loanDueDate}</FieldError>
              </div>
            </div>
          )}
        </div>
      )}

      <div>
        <Label htmlFor="note">Note (optional)</Label>
        <Input id="note" placeholder="Add a detail…" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <div className="flex items-center gap-3 pt-1">
        {isEditing && onDiscard && (
          <Button type="button" variant="outline" onClick={onDiscard} disabled={isSubmitting}>
            Discard
          </Button>
        )}
        <Button type="submit" className="flex-1" loading={isSubmitting} loadingText="Saving…">
          {isEditing ? "Save changes" : "Add transaction"}
        </Button>
      </div>
    </form>
  );
}
