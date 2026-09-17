"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SheetPortalContext } from "@/components/ui/sheet";

const SelectOpenContext = React.createContext<{ open: boolean; setOpen: (open: boolean) => void } | null>(null);

/**
 * Wraps Radix's Select.Root to track open state ourselves — SelectTrigger
 * below needs it to force-close on a second tap (see its own comment).
 */
export function Select({
  open: openProp,
  defaultOpen,
  onOpenChange,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root>) {
  const [openState, setOpenState] = React.useState(defaultOpen ?? false);
  const open = openProp ?? openState;
  const setOpen = React.useCallback(
    (next: boolean) => {
      setOpenState(next);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );

  return (
    <SelectOpenContext.Provider value={{ open, setOpen }}>
      <SelectPrimitive.Root open={open} onOpenChange={setOpen} {...props} />
    </SelectOpenContext.Provider>
  );
}

export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, onPointerDownCapture, onClick, ...props }, ref) => {
  const ctx = React.useContext(SelectOpenContext);
  const wasOpenRef = React.useRef(false);

  return (
    <SelectPrimitive.Trigger
      ref={ref}
      onPointerDownCapture={(event) => {
        onPointerDownCapture?.(event);
        wasOpenRef.current = ctx?.open ?? false;
      }}
      onClick={(event) => {
        onClick?.(event);
        // Radix's SelectTrigger never toggles closed on tap — its onClick
        // unconditionally (re)opens on every touch tap, with no check of the
        // current open state. If it was already open when this tap began, force
        // it closed after Radix's own handler finishes running (a microtask so
        // it wins regardless of whether that handler just re-opened it).
        if (wasOpenRef.current && ctx) {
          queueMicrotask(() => ctx.setOpen(false));
        }
      }}
      className={cn(
        "flex h-11 w-full items-center justify-between gap-2 overflow-hidden rounded-full bg-surface-2 px-4.5 text-[0.9375rem] text-text-primary outline-none",
        "focus-visible:bg-surface focus-visible:ring-2 focus-visible:ring-accent-subtle",
        "data-[placeholder]:text-text-muted disabled:opacity-50",
        // Radix's Select content is a DismissableLayer with `disableOutsidePointerEvents`
        // hardcoded true (not tied to the `modal` prop). When this Select is nested inside
        // another Radix layer (every Select in this app lives inside a Sheet), the *earlier*
        // layer — the Sheet's own Dialog.Content — loses pointer-events entirely while this
        // one is open, since only the highest disabled-outside-pointer-events layer gets
        // `auto`. That inherited `none` cascades down onto this trigger too, since the
        // trigger isn't part of the select's own content subtree — making it genuinely
        // unclickable, not just unresponsive. `pointer-events-auto` overrides that inherited
        // value directly on the trigger itself (an element's own declaration always beats
        // inheritance, regardless of an ancestor's specificity) so a second tap can register
        // at all — confirmed live via touch-emulated testing, not just from source.
        "pointer-events-auto",
        className,
      )}
      {...props}
    >
      {/* Radix's SelectValue renders a plain, unstyleable <span> (className passed to it is
          dropped) and portals the selected item's content directly inside it — so the only way
          to make that inner content shrink/truncate instead of overflowing the pill is to target
          it as a child selector from here. `block truncate` (not `flex`) on the inner span is what
          actually clips long text to an ellipsis — a flex display on a plain text leaf doesn't
          truncate, it just lets the text wrap onto a second line once the pill is too narrow. */}
      <span className="flex min-w-0 flex-1 items-center [&>span]:block [&>span]:min-w-0 [&>span]:flex-1 [&>span]:truncate">
        {children}
      </span>
      <SelectPrimitive.Icon className="shrink-0">
        <ChevronDown size={16} className="text-text-muted" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});
SelectTrigger.displayName = "SelectTrigger";

export const SelectContent = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => {
  // See SheetPortalContext (sheet.tsx) — portals into the enclosing Sheet's
  // content node instead of document.body so touch-scroll isn't blocked by
  // the Dialog's scroll lock when this Select is opened from inside a Sheet.
  const sheetContainer = React.useContext(SheetPortalContext);

  return (
    <SelectPrimitive.Portal container={sheetContainer ?? undefined}>
      <SelectPrimitive.Content
        ref={ref}
        position={position}
        sideOffset={6}
        className={cn(
          "z-50 max-h-72 min-w-(--radix-select-trigger-width) overflow-hidden rounded-2xl bg-surface shadow-md",
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport className="overscroll-contain p-1">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});
SelectContent.displayName = "SelectContent";

export const SelectItem = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-full py-2 pl-8 pr-3 text-sm text-text-primary outline-none",
      "data-[highlighted]:bg-surface-2",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2.5 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check size={14} className="text-accent-text" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = "SelectItem";
