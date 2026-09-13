"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import { Pencil } from "lucide-react";
import { nameSchema } from "@/lib/validations/profile";
import { updateNameAction } from "@/actions/profile";
import { AvatarPicker } from "@/components/ui/avatar-picker";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";

export function ProfileForm({ name, avatar, email }: { name: string; avatar: string; email: string }) {
  const [displayName, setDisplayName] = useState(name);
  const [editOpen, setEditOpen] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      <AvatarPicker value={avatar} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <p className="truncate text-sm font-semibold text-text-primary">{displayName}</p>
          <Dialog.Root open={editOpen} onOpenChange={handleOpenChange}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                aria-label="Edit name"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-2 hover:text-text-primary"
              >
                <Pencil size={13} strokeWidth={2.25} />
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-40 bg-overlay data-[state=open]:[animation:sheet-overlay-in_200ms_ease-out] data-[state=closed]:[animation:sheet-overlay-out_150ms_ease-in]" />
              <Dialog.Content
                aria-describedby={undefined}
                className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-surface p-6 shadow-lg outline-none data-[state=open]:[animation:sheet-scale-in_180ms_ease-out] data-[state=closed]:[animation:sheet-scale-out_150ms_ease-in]"
              >
                <Dialog.Title className="text-base font-semibold text-text-primary">Edit name</Dialog.Title>
                <form onSubmit={handleSave} className="mt-4 space-y-3">
                  <div>
                    <Label htmlFor="edit-name">Display name</Label>
                    <Input
                      id="edit-name"
                      autoFocus
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
                    <Button type="submit" className="flex-1" disabled={isSubmitting}>
                      {isSubmitting ? "Saving…" : "Save"}
                    </Button>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
        <p className="truncate text-sm text-text-secondary">{email}</p>
      </div>
    </div>
  );
}
