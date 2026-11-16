"use client";

import { useState } from "react";
import type * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Proceed",
  cancelLabel = "Cancel",
  destructive = false,
  solid = false,
  icon,
  notice,
  requireText,
  isConfirming = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** Solid red confirm button (for irreversible actions) instead of the soft red one. */
  solid?: boolean;
  /** Icon shown in a rounded tile above the title (red when destructive). */
  icon?: React.ReactNode;
  /** An amber callout under the description (e.g. "No backup on file"). */
  notice?: React.ReactNode;
  /** The confirm button stays disabled until the user types exactly this value. */
  requireText?: { label: string; value: string };
  isConfirming?: boolean;
  onConfirm: () => void;
}) {
  const [typed, setTyped] = useState("");
  const blocked = !!requireText && typed.trim().toLowerCase() !== requireText.value.toLowerCase();

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) setTyped("");
        onOpenChange(next);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-overlay backdrop-blur-sm data-[state=open]:[animation:sheet-overlay-in_200ms_ease-out] data-[state=closed]:[animation:sheet-overlay-out_150ms_ease-in]" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-3rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-[28px] bg-surface p-6 shadow-lg outline-none data-[state=open]:[animation:sheet-scale-in_180ms_ease-out] data-[state=closed]:[animation:sheet-scale-out_150ms_ease-in]"
        >
          {icon && (
            <span
              className={cn(
                "mb-3.5 flex h-13 w-13 items-center justify-center rounded-[18px]",
                destructive ? "bg-error-subtle text-error" : "bg-warning-subtle text-warning",
              )}
            >
              {icon}
            </span>
          )}
          <Dialog.Title className="text-[1.375rem] font-extrabold tracking-tight text-text-primary">{title}</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-snug text-text-secondary">{description}</Dialog.Description>
          {notice && <div className="mt-3 rounded-2xl bg-warning-subtle px-3 py-2.5 text-[0.8125rem] leading-snug text-warning">{notice}</div>}
          {requireText && (
            <div className="mt-3.5">
              <Label htmlFor="confirm-text">{requireText.label}</Label>
              <Input
                id="confirm-text"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={requireText.value}
                autoComplete="off"
                autoCapitalize="off"
              />
            </div>
          )}
          <div className="mt-4 flex items-center gap-2.5">
            <Dialog.Close asChild>
              <Button type="button" variant="outline" className="flex-1 rounded-[18px] font-bold" disabled={isConfirming}>
                {cancelLabel}
              </Button>
            </Dialog.Close>
            <Button
              type="button"
              variant={destructive ? "destructive" : "primary"}
              className={cn("flex-1 rounded-[18px] font-bold", solid && "bg-error text-white shadow-none hover:opacity-90 hover:bg-error")}
              onClick={onConfirm}
              loading={isConfirming}
              disabled={blocked}
            >
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
