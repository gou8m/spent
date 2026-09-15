"use client";

import type * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Info, X } from "lucide-react";

/**
 * The shared "(i)" info button, app-wide. Deliberately a blurred-backdrop
 * Dialog rather than a floating Popover — an info button's whole job is to
 * be read without distraction, and pairs (info button + a picker's own
 * Popover, e.g. CategoryPicker) need visibly different affordances so a
 * tap doesn't feel like it opened "the same kind of thing" twice.
 */
export function InfoPopover({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label={label}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-2 hover:text-text-secondary"
        >
          <Info size={14} strokeWidth={2} />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-overlay backdrop-blur-sm data-[state=open]:[animation:sheet-overlay-in_200ms_ease-out] data-[state=closed]:[animation:sheet-overlay-out_150ms_ease-in]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-surface p-5 shadow-lg outline-none data-[state=open]:[animation:sheet-scale-in_180ms_ease-out] data-[state=closed]:[animation:sheet-scale-out_150ms_ease-in]"
        >
          <div className="flex items-start justify-between gap-3">
            <Dialog.Title className="text-sm font-semibold text-text-primary">{label}</Dialog.Title>
            <Dialog.Close
              aria-label="Close"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-2 text-text-muted transition-colors hover:bg-surface-3 hover:text-text-primary"
            >
              <X size={15} strokeWidth={2} />
            </Dialog.Close>
          </div>
          <div className="mt-2 text-sm leading-relaxed text-text-secondary">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
