"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import { Mail } from "lucide-react";
import { emailChangeSchema } from "@/lib/validations/profile";
import { requestEmailChangeAction, cancelEmailChangeAction } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { useDialogAutoFocus } from "@/hooks/use-dialog-auto-focus";

export function EmailSection({ email, pendingEmail }: { email: string; pendingEmail: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [newEmail, setNewEmail] = useState(pendingEmail ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const { ref: contentRef, onOpenAutoFocus } = useDialogAutoFocus<HTMLDivElement>();

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setNewEmail(pendingEmail ?? "");
      setError(null);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = emailChangeSchema.safeParse({ newEmail });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid email");
      return;
    }

    setIsSubmitting(true);
    const result = await requestEmailChangeAction(parsed.data);
    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    toast.success(`Verification link sent to ${parsed.data.newEmail}`);
    setOpen(false);
    router.refresh();
  }

  async function handleCancel() {
    setIsCancelling(true);
    await cancelEmailChangeAction();
    setIsCancelling(false);
    toast.success("Email change cancelled");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <Mail size={17} className="shrink-0 text-text-muted" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-primary">Email</p>
        <p className="truncate text-[0.8125rem] text-text-secondary">{email}</p>
        {pendingEmail && (
          <p className="mt-1 text-[0.8125rem] text-accent-text">
            Verification pending for {pendingEmail} —{" "}
            <button type="button" onClick={handleCancel} disabled={isCancelling} className="underline underline-offset-2 disabled:opacity-50">
              cancel
            </button>
          </p>
        )}
      </div>

      <Dialog.Root open={open} onOpenChange={handleOpenChange}>
        <Dialog.Trigger asChild>
          <Button type="button" variant="outline" size="sm" className="shrink-0">
            {pendingEmail ? "Resend" : "Change"}
          </Button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-overlay backdrop-blur-sm data-[state=open]:[animation:sheet-overlay-in_200ms_ease-out] data-[state=closed]:[animation:sheet-overlay-out_150ms_ease-in]" />
          <Dialog.Content
            ref={contentRef}
            tabIndex={-1}
            onOpenAutoFocus={onOpenAutoFocus}
            className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-surface p-6 shadow-lg outline-none data-[state=open]:[animation:sheet-scale-in_180ms_ease-out] data-[state=closed]:[animation:sheet-scale-out_150ms_ease-in]"
          >
            <Dialog.Title className="text-base font-semibold text-text-primary">Change email</Dialog.Title>
            <Dialog.Description className="mt-2 text-sm leading-relaxed text-text-secondary">
              We&apos;ll send a verification link to the new address. Your sign-in email won&apos;t change until you click it.
            </Dialog.Description>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div>
                <Label htmlFor="newEmail">New email</Label>
                <Input
                  id="newEmail"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
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
                <Button type="submit" className="flex-1" loading={isSubmitting} loadingText="Sending…">
                  Send link
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
