import type * as React from "react";
import { getSwatch, type SwatchId } from "@/lib/colors";
import { getIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

const sizeMap = {
  sm: { box: "h-8 w-8", icon: 15 },
  md: { box: "h-10 w-10", icon: 18 },
  lg: { box: "h-13 w-13", icon: 24 },
};

export function IconChip({
  icon,
  color,
  size = "md",
  className,
}: {
  icon: string;
  color: string;
  size?: keyof typeof sizeMap;
  className?: string;
}) {
  const swatch = getSwatch(color as SwatchId);
  const Icon = getIcon(icon);
  const { box, icon: iconSize } = sizeMap[size];

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full",
        "bg-(--chip-bg-light) text-(--chip-fg-light) dark:bg-(--chip-bg-dark) dark:text-(--chip-fg-dark)",
        box,
        className,
      )}
      style={
        {
          "--chip-bg-light": swatch.light.bg,
          "--chip-fg-light": swatch.light.fg,
          "--chip-bg-dark": swatch.dark.bg,
          "--chip-fg-dark": swatch.dark.fg,
        } as React.CSSProperties
      }
    >
      {/* eslint-disable-next-line react-hooks/static-components -- `Icon` is looked
          up from the static ICONS table by a user-chosen name; identity is stable
          across renders even though the linter can't prove it statically. */}
      <Icon size={iconSize} strokeWidth={2} />
    </span>
  );
}
