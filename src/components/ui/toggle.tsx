"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

export function Toggle({
  checked,
  onCheckedChange,
  label,
  disabled,
  className,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Accessible name — every reference toggle sits beside its own visible label,
   * so this is almost always `aria-label`, not rendered text. */
  label: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "relative h-7.5 w-12.5 shrink-0 rounded-full bg-border-strong transition-colors data-[state=checked]:bg-accent disabled:opacity-50",
        className,
      )}
    >
      <SwitchPrimitive.Thumb className="block h-6 w-6 translate-x-0.75 rounded-full bg-surface transition-transform data-[state=checked]:translate-x-5.75" />
    </SwitchPrimitive.Root>
  );
}
