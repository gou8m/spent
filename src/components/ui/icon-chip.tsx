import type * as React from "react";
import { getSwatch, type SwatchId } from "@/lib/colors";
import { getIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

const sizeMap = {
  sm: { box: "h-8 w-8", icon: 15, text: "text-xs" },
  md: { box: "h-10 w-10", icon: 18, text: "text-sm" },
  lg: { box: "h-13 w-13", icon: 24, text: "text-lg" },
};

/** `Icon` is looked up from the static ICONS table by a user-chosen name; its
 * identity is stable across renders even though the linter can't prove that
 * statically for an inline lookup, so it's split into its own component. */
function IconGlyph({ icon, size }: { icon: string; size: number }) {
  const Icon = getIcon(icon);
  // eslint-disable-next-line react-hooks/static-components -- see comment above
  return <Icon size={size} strokeWidth={2} />;
}

export function IconChip({
  icon,
  initial,
  color,
  size = "md",
  className,
}: {
  /** Ignored when `initial` is given. */
  icon?: string;
  /** Renders as a bold letter instead of `icon` — used for the default avatar. */
  initial?: string;
  color: string;
  size?: keyof typeof sizeMap;
  className?: string;
}) {
  const swatch = getSwatch(color as SwatchId);
  const { box, icon: iconSize, text } = sizeMap[size];

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
      {initial ? <span className={cn("font-bold", text)}>{initial}</span> : <IconGlyph icon={icon!} size={iconSize} />}
    </span>
  );
}
