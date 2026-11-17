"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDialogAutoFocus } from "@/hooks/use-dialog-auto-focus";
import { useSheetBackButton } from "@/hooks/use-sheet-back-button";
import { useHeldWhileClosed } from "@/hooks/use-held-while-closed";

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
  stackLevel = 0,
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
  /** Bumps this Sheet's overlay/content above the default z-40/z-50 tier, in steps of
   * 20 — for the rare case where this Sheet can itself open *while another, unrelated*
   * Sheet is already open (e.g. category creation launched via the transaction form's
   * "Custom" category button, which navigates to a different page without closing the
   * still-open Add Transaction sheet). Every normal Sheet leaves this at 0; without it,
   * the second sheet's own dimming overlay (z-40) would render *behind* the first
   * sheet's content (z-50) and never visually darken it, since they're independent
   * Dialog instances the shared z-40/z-50 convention doesn't otherwise rank. */
  stackLevel?: number;
}) {
  // What the sheet shows is frozen the moment it starts closing, so the exit animation plays on the
  // same content instead of flashing an empty form or a blank card.
  title = useHeldWhileClosed(open, title);
  description = useHeldWhileClosed(open, description);
  children = useHeldWhileClosed(open, children);
  footer = useHeldWhileClosed(open, footer);
  hideHeader = useHeldWhileClosed(open, hideHeader);
  const [contentNode, setContentNode] = React.useState<HTMLElement | null>(null);
  const { ref: focusRef, onOpenAutoFocus } = useDialogAutoFocus<HTMLDivElement>();
  useSheetBackButton(open, () => onOpenChange(false));

  function setRefs(node: HTMLDivElement | null) {
    setContentNode(node);
    focusRef.current = node;
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="sheet-overlay fixed inset-0 bg-overlay backdrop-blur-sm"
          style={{ zIndex: 40 + stackLevel * 20 }}
        />
        <Dialog.Content
          ref={setRefs}
          tabIndex={-1}
          onOpenAutoFocus={onOpenAutoFocus}
          {...((hideHeader || !description) && { "aria-describedby": undefined })}
          style={{ zIndex: 50 + stackLevel * 20 }}
          className={cn(
            "sheet-content fixed flex flex-col bg-bg shadow-lg outline-none",
            "inset-x-0 bottom-0 max-h-[92vh] rounded-t-[28px]",
            "sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[85vh] sm:w-full sm:max-w-150 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[32px]",
          )}
        >
          <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-border-strong sm:hidden" />

          {hideHeader ? (
            <Dialog.Title className="sr-only">{title}</Dialog.Title>
          ) : (
            <div className="shrink-0 px-6 pb-2 pt-4">
              <div className="flex items-center justify-between gap-3">
                <Dialog.Title className="min-w-0 flex-1 truncate text-xl font-extrabold tracking-tight text-text-primary">
                  {title}
                </Dialog.Title>
                <Dialog.Close
                  aria-label="Close"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-surface-2 text-text-primary transition-colors hover:bg-surface-3"
                >
                  <X size={20} strokeWidth={2} />
                </Dialog.Close>
              </div>
              {description && <Dialog.Description className="mt-1 text-sm text-text-secondary">{description}</Dialog.Description>}
            </div>
          )}

          <div className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]", hideHeader && "pt-5")}>
            <SheetPortalContext.Provider value={contentNode}>{children}</SheetPortalContext.Provider>
          </div>

          {footer && <div className="safe-bottom shrink-0 bg-surface-2/60 px-6 py-4">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
