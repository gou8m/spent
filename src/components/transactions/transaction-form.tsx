"use client";

import { useState, useEffect, type FormEvent } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { transactionSchema } from "@/lib/validations/transaction";
import { createTransactionAction, updateTransactionAction } from "@/actions/transactions";
import { getExchangeRateAction } from "@/actions/exchange-rate";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { DatePicker } from "@/components/ui/date-picker";
import { AccountPicker, type AccountOption } from "@/components/transactions/account-picker";
import { CategoryPicker, type CategoryOption } from "@/components/transactions/category-picker";
import { decimalsForCurrency } from "@/lib/money";
import type { TransactionWithRelations } from "@/lib/data/transactions";

type TxType = "EXPENSE" | "INCOME" | "TRANSFER";

export function TransactionForm({
  accounts,
  expenseCategories,
  incomeCategories,
  defaultType = "EXPENSE",
  defaultAccountId,
  editing,
  onSaved,
  onDiscard,
}: {
  accounts: AccountOption[];
  expenseCategories: CategoryOption[];
  incomeCategories: CategoryOption[];
  defaultType?: TxType;
  defaultAccountId?: string;
  editing?: TransactionWithRelations;
  onSaved: () => void;
  onDiscard?: () => void;
}) {
  const isEditing = !!editing;

  const [type, setType] = useState<TxType>((editing?.type as TxType) ?? defaultType);
  const [amount, setAmount] = useState(editing ? String(editing.amount / 10 ** decimalsForCurrency(editing.currency)) : "");
  const [accountId, setAccountId] = useState(editing?.accountId ?? defaultAccountId ?? accounts[0]?.id ?? "");
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const currency = selectedAccount?.currency ?? "USD";
  const categories = type === "INCOME" ? incomeCategories : expenseCategories;

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});

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
      tagIds: [] as string[],
    };

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
        }}
        options={[
          { value: "EXPENSE", label: "Expense" },
          { value: "INCOME", label: "Income" },
          { value: "TRANSFER", label: "Transfer" },
        ]}
      />

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
          <AccountPicker accounts={accounts} value={accountId} onChange={setAccountId} />
          <FieldError>{errors.accountId}</FieldError>
        </div>

        {type === "TRANSFER" ? (
          <div>
            <Label>To account</Label>
            <AccountPicker
              accounts={accounts}
              value={transferToAccountId}
              onChange={setTransferToAccountId}
              exclude={accountId}
              placeholder="Choose destination"
            />
            <FieldError>{errors.transferToAccountId}</FieldError>
          </div>
        ) : (
          <div>
            <Label>Category</Label>
            <CategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} />
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
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder={type === "TRANSFER" ? "Transfer" : "e.g. Groceries"}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : isEditing ? "Save changes" : "Add transaction"}
        </Button>
      </div>
    </form>
  );
}
