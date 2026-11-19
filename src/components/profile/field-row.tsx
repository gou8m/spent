"use client";

import { useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { useDialogAutoFocus } from "@/hooks/use-dialog-auto-focus";

/**
 * A saved detail shown like the email row: label, the value below it and a Change button on the right.
 * With no value yet the button says Add. `children` is the form inside the dialog and gets `close`.
 * `locked` hides the button and shows `lockedNote` instead (used when a detail may no longer change).
 */
export function FieldRow({
  icon,
  label,
  value,
  title,
  description,
  locked = false,
  lockedNote,
  children,
}: {
  icon: ReactNode;
  label: string;
  value: string | null;
  /** Dialog title. */
  title: string;
  description?: string;
  locked?: boolean;
  lockedNote?: string;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { ref: contentRef, onOpenAutoFocus } = useDialogAutoFocus<HTMLDivElement>();

  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="shrink-0 text-text-muted">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="truncate text-[0.8125rem] text-text-secondary">{value ?? "Not added"}</p>
      </div>

      {locked ? (
        lockedNote && <span className="shrink-0 text-xs font-semibold text-text-muted">{lockedNote}</span>
      ) : (
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <Button type="button" variant="outline" size="sm" className="shrink-0">
              {value ? "Change" : "Add"}
            </Button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-overlay backdrop-blur-sm data-[state=open]:[animation:sheet-overlay-in_200ms_ease-out] data-[state=closed]:[animation:sheet-overlay-out_150ms_ease-in]" />
            <Dialog.Content
              ref={contentRef}
              tabIndex={-1}
              onOpenAutoFocus={onOpenAutoFocus}
              className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-[28px] bg-surface p-5.5 shadow-lg outline-none data-[state=open]:[animation:sheet-scale-in_180ms_ease-out] data-[state=closed]:[animation:sheet-scale-out_150ms_ease-in]"
            >
              <Dialog.Title className="text-xl font-extrabold tracking-tight text-text-primary">{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-2 text-sm text-text-secondary">{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{title}</Dialog.Description>
              )}
              <div className="mt-4">{children(() => setOpen(false))}</div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </div>
  );
}
