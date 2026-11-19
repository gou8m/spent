import { getSwatch } from "@/lib/colors";
import { initialsOf, toneFor } from "@/lib/party";
import { cn } from "@/lib/utils";

/** A round avatar with the person's initials, in a colour that is the same every time for the same name. */
export function PartyAvatar({ name, keyName, size = 48, className }: { name: string; keyName: string; size?: number; className?: string }) {
  const swatch = getSwatch(toneFor(keyName));
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-(--av-bg-light) font-extrabold text-(--av-fg-light) dark:bg-(--av-bg-dark) dark:text-(--av-fg-dark)",
        className,
      )}
      style={
        {
          width: size,
          height: size,
          fontSize: size * 0.36,
          "--av-bg-light": swatch.light.bg,
          "--av-fg-light": swatch.light.fg,
          "--av-bg-dark": swatch.dark.bg,
          "--av-fg-dark": swatch.dark.fg,
        } as React.CSSProperties
      }
    >
      {initialsOf(name)}
    </span>
  );
}
