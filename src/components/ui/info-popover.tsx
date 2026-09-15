"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Info } from "lucide-react";
import { SheetPortalContext } from "@/components/ui/sheet";

/**
 * The shared "(i)" info button, app-wide — a small speech-bubble anchored to
 * the button itself (with a pointer arrow), not a centered modal. Dismisses
 * on an outside click/Escape for free via Radix Popover, so there's no close
 * button to render or state to manage.
 */
export function InfoPopover({ label, children }: { label: string; children: React.ReactNode }) {
  // Portal into the enclosing Sheet's own content node (if any), same reasoning
  // as the shared PopoverContent — see SheetPortalContext for why this matters
  // for touch scrolling when opened from inside a Sheet.
  const sheetContainer = React.useContext(SheetPortalContext);

  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label={label}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-2 hover:text-text-secondary"
        >
          <Info size={14} strokeWidth={2} />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal container={sheetContainer ?? undefined}>
        <PopoverPrimitive.Content
          side="bottom"
          align="center"
          sideOffset={9}
          collisionPadding={12}
          className="z-50 w-64 max-w-[calc(100vw-2rem)] rounded-2xl bg-surface p-3.5 text-sm leading-relaxed text-text-secondary shadow-lg outline-none"
        >
          {children}
          {/* The Content's own shadow-lg doesn't extend to this separate Arrow shape, so
              it needs its own drop-shadow or it reads as a flat, invisible sliver against
              a similarly light page background. */}
          <PopoverPrimitive.Arrow className="fill-surface drop-shadow-sm" width={14} height={7} />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
