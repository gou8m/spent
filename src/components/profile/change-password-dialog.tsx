"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import { KeyRound } from "lucide-react";
import { changePasswordSchema } from "@/lib/validations/profile";
import { changePasswordAction } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Label, FieldError } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useDialogAutoFocus } from "@/hooks/use-dialog-auto-focus";

export function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ currentPassword?: string; newPassword?: string; confirmPassword?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { ref: contentRef, onOpenAutoFocus } = useDialogAutoFocus<HTMLDivElement>();

  function reset() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setErrors({});
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) reset();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});

    const parsed = changePasswordSchema.safeParse({ currentPassword, newPassword });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: "Passwords don't match" });
      return;
    }

    setIsSubmitting(true);
    const result = await changePasswordAction(parsed.data);
    setIsSubmitting(false);

    if (result.error) {
      setErrors({ currentPassword: result.error });
      return;
    }
    toast.success("Password updated");
    setOpen(false);
    reset();
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <button type="button" className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-surface-2">
          <KeyRound size={17} className="text-text-muted" />
          <span className="flex-1 text-sm font-medium text-text-primary">Change password</span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-overlay backdrop-blur-sm data-[state=open]:[animation:sheet-overlay-in_200ms_ease-out] data-[state=closed]:[animation:sheet-overlay-out_150ms_ease-in]" />
        <Dialog.Content
          ref={contentRef}
          tabIndex={-1}
          onOpenAutoFocus={onOpenAutoFocus}
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-surface p-6 shadow-lg outline-none data-[state=open]:[animation:sheet-scale-in_180ms_ease-out] data-[state=closed]:[animation:sheet-scale-out_150ms_ease-in]"
        >
          <Dialog.Title className="text-base font-semibold text-text-primary">Change password</Dialog.Title>
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="currentPassword">Current password</Label>
                <Link
                  href="/forgot-password"
                  className="mb-1.5 text-[0.8125rem] font-medium text-accent-text hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                id="currentPassword"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                error={!!errors.currentPassword}
              />
              <FieldError>{errors.currentPassword}</FieldError>
            </div>
            <div>
              <Label htmlFor="newPassword">New password</Label>
              <PasswordInput
                id="newPassword"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                error={!!errors.newPassword}
              />
              {errors.newPassword ? (
                <FieldError>{errors.newPassword}</FieldError>
              ) : (
                <p className="mt-1.5 text-[0.8125rem] text-text-muted">Uppercase, lowercase, a number, and a symbol.</p>
              )}
            </div>
            <div>
              <Label htmlFor="confirmNewPassword">Confirm new password</Label>
              <PasswordInput
                id="confirmNewPassword"
                autoComplete="new-password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={!!errors.confirmPassword}
              />
              <FieldError>{errors.confirmPassword}</FieldError>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" className="flex-1" disabled={isSubmitting}>
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? "Updating…" : "Update password"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
