"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDialogAutoFocus } from "@/hooks/use-dialog-auto-focus";

/**
 * A Popover/Select portaled to `document.body` from inside this Sheet sits
 * outside the Dialog's own DOM subtree — so `react-remove-scroll` (which the
 * modal Dialog uses to lock background scroll while open) can't tell it
 * apart from actual background content, and blocks touch-scroll on it too.
 * The fix is to portal those nested pickers into the Dialog's own content
 * node instead; this context exposes that node so `PopoverContent` and
 * `SelectContent` can do that automatically without every call site having
 * to wire it up. See https://github.com/radix-ui/primitives/issues/1159.
 */
export const SheetPortalContext = React.createContext<HTMLElement | null>(null);

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
  const [contentNode, setContentNode] = React.useState<HTMLElement | null>(null);
  const { ref: focusRef, onOpenAutoFocus } = useDialogAutoFocus<HTMLDivElement>();

  function setRefs(node: HTMLDivElement | null) {
    setContentNode(node);
    focusRef.current = node;
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="sheet-overlay fixed inset-0 z-40 bg-overlay backdrop-blur-sm" />
        <Dialog.Content
          ref={setRefs}
          tabIndex={-1}
          onOpenAutoFocus={onOpenAutoFocus}
          {...((hideHeader || !description) && { "aria-describedby": undefined })}
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
              <Dialog.Close
                aria-label="Close"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-text-muted transition-colors hover:bg-surface-3 hover:text-text-primary"
              >
                <X size={18} strokeWidth={2} />
              </Dialog.Close>
            </div>
          )}

          <div className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4", hideHeader && "pt-5")}>
            <SheetPortalContext.Provider value={contentNode}>{children}</SheetPortalContext.Provider>
          </div>

          {footer && <div className="safe-bottom shrink-0 bg-surface-2/60 px-6 py-4">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
