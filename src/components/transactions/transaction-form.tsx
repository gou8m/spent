"use client";

import { useState, type FormEvent } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { transactionSchema } from "@/lib/validations/transaction";
import { createTransactionAction, updateTransactionAction, deleteTransactionAction } from "@/actions/transactions";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
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
}: {
  accounts: AccountOption[];
  expenseCategories: CategoryOption[];
  incomeCategories: CategoryOption[];
  defaultType?: TxType;
  defaultAccountId?: string;
  editing?: TransactionWithRelations;
  onSaved: () => void;
}) {
  const isEditing = !!editing;

  const [type, setType] = useState<TxType>((editing?.type as TxType) ?? defaultType);
  const [amount, setAmount] = useState(editing ? String(editing.amount / 10 ** decimalsForCurrency(editing.currency)) : "");
  const [accountId, setAccountId] = useState(editing?.accountId ?? defaultAccountId ?? accounts[0]?.id ?? "");
  const [transferToAccountId, setTransferToAccountId] = useState(editing?.transferToAccountId ?? "");
  const [categoryId, setCategoryId] = useState(editing?.categoryId ?? "");
  const [title, setTitle] = useState(editing?.title ?? "");
  const [note, setNote] = useState(editing?.note ?? "");
  const [date, setDate] = useState(format(editing?.date ?? new Date(), "yyyy-MM-dd"));
  const [status, setStatus] = useState<"COMPLETED" | "UPCOMING">((editing?.status as "COMPLETED" | "UPCOMING") ?? "COMPLETED");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const currency = selectedAccount?.currency ?? "USD";
  const categories = type === "INCOME" ? incomeCategories : expenseCategories;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});

    const payload = {
      type,
      amount: Number(amount),
      currency,
      accountId,
      transferToAccountId: type === "TRANSFER" ? transferToAccountId : undefined,
      categoryId: type === "TRANSFER" ? undefined : categoryId,
      title: title || (type === "TRANSFER" ? "Transfer" : categories.find((c) => c.id === categoryId)?.name || ""),
      note,
      date: new Date(date),
      status,
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

  async function handleDelete() {
    if (!editing) return;
    setIsDeleting(true);
    const result = await deleteTransactionAction(editing.id);
    setIsDeleting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Transaction deleted");
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
            className="h-16 w-full rounded-md border border-border bg-surface pl-11 pr-4 font-numeric text-2xl font-semibold text-text-primary outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent-subtle"
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
          <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} error={!!errors.date} />
          <FieldError>{errors.date}</FieldError>
        </div>
      </div>

      <div>
        <Label htmlFor="note">Note (optional)</Label>
        <Input id="note" placeholder="Add a detail…" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <div className="flex items-center justify-between rounded-md border border-border bg-surface-2 px-3.5 py-2.5">
        <span className="text-sm font-medium text-text-secondary">This has already happened</span>
        <button
          type="button"
          role="switch"
          aria-checked={status === "COMPLETED"}
          onClick={() => setStatus(status === "COMPLETED" ? "UPCOMING" : "COMPLETED")}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${status === "COMPLETED" ? "bg-accent" : "bg-border-strong"}`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${status === "COMPLETED" ? "translate-x-5.5" : "translate-x-0.5"}`}
          />
        </button>
      </div>

      <div className="flex items-center gap-3 pt-1">
        {isEditing && (
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting || isSubmitting}>
            {isDeleting ? "Deleting…" : "Delete"}
          </Button>
        )}
        <Button type="submit" className="flex-1" disabled={isSubmitting || isDeleting}>
          {isSubmitting ? "Saving…" : isEditing ? "Save changes" : "Add transaction"}
        </Button>
      </div>
    </form>
  );
}
