"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { updateCurrencyAction } from "@/actions/profile";
import { CURRENCIES, MAX_CURRENCY_CHANGES } from "@/lib/constants";

export function CurrencySelector({ currency, changesUsed }: { currency: string; changesUsed: number }) {
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

  if (remaining <= 0) {
    return <span className="text-sm text-text-muted">{value} — locked</span>;
  }

  const pendingName = pending ? CURRENCIES.find((c) => c.code === pending)?.name ?? pending : "";
  const remainingAfter = remaining - 1;

  return (
    <>
      <Select value={value} onValueChange={(next) => next !== value && setPending(next)}>
        <SelectTrigger className="h-9 w-auto min-w-28" disabled={isSaving}>
          <SelectValue />
        </SelectTrigger>
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
