"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Coins } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { updateCurrencyAction } from "@/actions/profile";
import { CURRENCIES, MAX_CURRENCY_CHANGES } from "@/lib/constants";

export function CurrencySelector({ currency, changesUsed, variant = "compact" }: { currency: string; changesUsed: number; variant?: "compact" | "row" }) {
  const [value, setValue] = useState(currency);
  const [pending, setPending] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const remaining = MAX_CURRENCY_CHANGES - changesUsed;

  async function confirmChange() {
    if (!pending) return;
    setIsSaving(true);
    const result = await updateCurrencyAction(pending);
    setIsSaving(false);

    if (result.error) {
      toast.error(result.error);
      setPending(null);
      return;
    }
    setValue(pending);
    setPending(null);
    toast.success("Primary currency updated");
  }

  const currencyName = CURRENCIES.find((c) => c.code === value)?.name ?? value;

  if (remaining <= 0) {
    if (variant === "row") {
      return (
        <div className="flex items-center gap-3 rounded-[22px] bg-surface-2 px-4 py-3">
          <span className="flex h-11.5 w-11.5 shrink-0 items-center justify-center rounded-[14px] bg-surface text-accent">
            <Coins size={22} strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold text-text-primary">{currencyName} ({value})</p>
            <p className="text-xs text-text-secondary">Locked, no changes left</p>
          </div>
        </div>
      );
    }
    return <span className="text-sm text-text-muted">{value} — locked</span>;
  }

  const pendingName = pending ? CURRENCIES.find((c) => c.code === pending)?.name ?? pending : "";
  const remainingAfter = remaining - 1;

  return (
    <>
      <Select value={value} onValueChange={(next) => next !== value && setPending(next)}>
        {variant === "row" ? (
          <SelectTrigger className="h-auto min-h-17.5 gap-3 rounded-[22px] py-3" disabled={isSaving}>
            <span className="flex h-11.5 w-11.5 shrink-0 items-center justify-center rounded-[14px] bg-surface text-accent">
              <Coins size={22} strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-base font-bold">
                {currencyName} ({value})
              </span>
              <span className="block text-xs font-normal text-text-secondary">
                {remaining} change{remaining === 1 ? "" : "s"} left
              </span>
            </span>
          </SelectTrigger>
        ) : (
          <SelectTrigger className="h-9 w-auto min-w-28" disabled={isSaving}>
            <SelectValue />
          </SelectTrigger>
        )}
        <SelectContent align="end">
          {CURRENCIES.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              {c.code} — {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <ConfirmDialog
        open={!!pending}
        onOpenChange={(open) => !open && setPending(null)}
        title="Change primary currency?"
        description={
          <>
            Switch your primary currency to <span className="font-medium text-text-primary">{pending} — {pendingName}</span>?
            You have {remaining} change{remaining === 1 ? "" : "s"} left — after this, {remainingAfter} will remain.
          </>
        }
        confirmLabel="Yes, proceed"
        cancelLabel="No, cancel"
        isConfirming={isSaving}
        onConfirm={confirmChange}
      />
    </>
  );
}
