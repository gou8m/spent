"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  hideHeader = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Skips the visible title row + close button — the drag handle (and tapping
   * outside, which closes by default) become the only affordances. The title
   * is still rendered for screen readers (Radix requires it), just visually
   * hidden. Use for lightweight pickers like the mobile "More" grid where a
   * header would just add clutter. */
  hideHeader?: boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="sheet-overlay fixed inset-0 z-40 bg-overlay" />
        <Dialog.Content
          className={cn(
            "sheet-content fixed z-50 flex flex-col bg-surface shadow-lg outline-none",
            "inset-x-0 bottom-0 max-h-[92vh] rounded-t-3xl",
            "sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[85vh] sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl",
          )}
        >
          <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-border-strong sm:hidden" />

          {hideHeader ? (
            <Dialog.Title className="sr-only">{title}</Dialog.Title>
          ) : (
            <div className="flex shrink-0 items-start justify-between gap-3 px-6 py-5">
              <div>
                <Dialog.Title className="text-[1.0625rem] font-semibold text-text-primary">{title}</Dialog.Title>
                {description && <Dialog.Description className="mt-0.5 text-sm text-text-secondary">{description}</Dialog.Description>}
              </div>
              <Dialog.Close className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-text-muted transition-colors hover:bg-surface-3 hover:text-text-primary">
                <X size={18} strokeWidth={2} />
              </Dialog.Close>
            </div>
          )}

          <div className={cn("min-h-0 flex-1 overflow-y-auto px-6 py-4", hideHeader && "pt-5")}>{children}</div>

          {footer && <div className="safe-bottom shrink-0 bg-surface-2/60 px-6 py-4">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
