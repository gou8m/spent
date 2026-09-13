"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";
import { SheetPortalContext } from "@/components/ui/sheet";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;

export const PopoverContent = React.forwardRef<
  React.ComponentRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "start", sideOffset = 8, ...props }, ref) => {
  // Portal into the enclosing Sheet's own content node (if any) instead of
  // document.body — see SheetPortalContext for why this matters for touch
  // scrolling when this popover is opened from inside a Sheet.
  const sheetContainer = React.useContext(SheetPortalContext);

  return (
    <PopoverPrimitive.Portal container={sheetContainer ?? undefined}>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn("z-50 rounded-3xl bg-surface shadow-lg outline-none", className)}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
});
PopoverContent.displayName = "PopoverContent";
