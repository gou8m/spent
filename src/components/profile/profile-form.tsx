"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import { SquarePen } from "lucide-react";
import { nameSchema } from "@/lib/validations/profile";
import { updateNameAction } from "@/actions/profile";
import { AvatarPicker } from "@/components/ui/avatar-picker";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { useDialogAutoFocus } from "@/hooks/use-dialog-auto-focus";

export function ProfileForm({
  name,
  avatar,
  email,
  isVerified,
}: {
  name: string;
  avatar: string;
  email: string;
  isVerified: boolean;
}) {
  const [displayName, setDisplayName] = useState(name);
  const [editOpen, setEditOpen] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { ref: contentRef, onOpenAutoFocus } = useDialogAutoFocus<HTMLDivElement>();

  function handleOpenChange(nextOpen: boolean) {
    setEditOpen(nextOpen);
    if (nextOpen) {
      setDraftName(displayName);
      setError(null);
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = nameSchema.safeParse({ name: draftName });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a name");
      return;
    }

    setIsSubmitting(true);
    const result = await updateNameAction(parsed.data.name);
    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    setDisplayName(parsed.data.name);
    toast.success("Name updated");
    setEditOpen(false);
  }

  return (
    <div className="flex items-center gap-4">
      <AvatarPicker value={avatar} name={displayName} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 truncate text-sm font-semibold text-text-primary">
          <span className="truncate">{displayName}</span>
          {isVerified && <VerifiedBadge />}
        </p>
        <p className="truncate text-sm text-text-secondary">{email}</p>
      </div>

      <Dialog.Root open={editOpen} onOpenChange={handleOpenChange}>
        <Dialog.Trigger asChild>
          <button
            type="button"
            aria-label="Edit name"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-text-secondary transition-colors hover:bg-surface-3 hover:text-text-primary"
          >
            <SquarePen size={16} strokeWidth={2} />
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
            <Dialog.Title className="text-base font-semibold text-text-primary">Edit name</Dialog.Title>
            <form onSubmit={handleSave} className="mt-4 space-y-3">
              <div>
                <Label htmlFor="edit-name">Display name</Label>
                <Input
                  id="edit-name"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
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
                <Button type="submit" className="flex-1" loading={isSubmitting} loadingText="Saving…">
                  Save
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
