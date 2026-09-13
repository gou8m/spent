"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import { contributeSchema } from "@/lib/validations/goal";
import { contributeToGoalAction } from "@/actions/goals";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { formatMoney } from "@/lib/money";
import { useDialogAutoFocus } from "@/hooks/use-dialog-auto-focus";

export function ContributeDialog({
  goalId,
  goalName,
  currency,
  open,
  onOpenChange,
  onContributed,
}: {
  goalId: string;
  goalName: string;
  currency: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContributed: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { ref: contentRef, onOpenAutoFocus } = useDialogAutoFocus<HTMLDivElement>();

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setAmount("");
      setError(null);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = contributeSchema.safeParse({ amount: Number(amount) });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid amount");
      return;
    }

    setIsSubmitting(true);
    const result = await contributeToGoalAction(goalId, parsed.data);
    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    toast.success(`Added ${formatMoney(parsed.data.amount * 100, currency)} to ${goalName}`);
    handleOpenChange(false);
    onContributed();
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-overlay backdrop-blur-sm data-[state=open]:[animation:sheet-overlay-in_200ms_ease-out] data-[state=closed]:[animation:sheet-overlay-out_150ms_ease-in]" />
        <Dialog.Content
          ref={contentRef}
          tabIndex={-1}
          onOpenAutoFocus={onOpenAutoFocus}
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-surface p-6 shadow-lg outline-none data-[state=open]:[animation:sheet-scale-in_180ms_ease-out] data-[state=closed]:[animation:sheet-scale-out_150ms_ease-in]"
        >
          <Dialog.Title className="text-base font-semibold text-text-primary">Add funds to {goalName}</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-relaxed text-text-secondary">
            Enter how much you&apos;d like to contribute.
          </Dialog.Description>
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div>
              <Label htmlFor="contribute-amount">Amount ({currency})</Label>
              <Input
                id="contribute-amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="0.00"
                error={!!error}
              />
              <FieldError>{error}</FieldError>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" className="flex-1" disabled={isSubmitting}>
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? "Adding…" : "Add funds"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
