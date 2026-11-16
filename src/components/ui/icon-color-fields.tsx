"use client";

import { Label } from "@/components/ui/input";
import { getIcon } from "@/lib/icons";
import { getSwatch, type SwatchId } from "@/lib/colors";
import { cn } from "@/lib/utils";

/** Split out so the ICONS-table lookup doesn't make the tile a dynamic component. */
function IconGlyph({ name }: { name: string }) {
  const Icon = getIcon(name);
  // eslint-disable-next-line react-hooks/static-components -- see comment above
  return <Icon size={24} strokeWidth={2} />;
}

/** The inline ICON tile row + COLOUR dot row used by the goal and category forms —
 * a short curated set shown directly, instead of the popover grid. A saved value
 * outside the curated set is prepended so editing never silently drops it. */
export function IconColorFields({
  icon,
  color,
  icons,
  colors,
  onChange,
}: {
  icon: string;
  color: string;
  icons: string[];
  colors: SwatchId[];
  onChange: (value: { icon: string; color: SwatchId }) => void;
}) {
  const swatch = getSwatch(color);
  const iconChoices = icons.includes(icon) ? icons : [icon, ...icons];
  const colorChoices = colors.includes(color as SwatchId) ? colors : [color as SwatchId, ...colors];

  return (
    <>
      <div>
        <Label>Icon</Label>
        <div className="mt-2 flex flex-wrap gap-2.5">
          {iconChoices.map((name) => {
            const selected = icon === name;
            return (
              <button
                key={name}
                type="button"
                aria-label={name}
                aria-pressed={selected}
                onClick={() => onChange({ icon: name, color: color as SwatchId })}
                className={cn(
                  "flex h-13 w-13 items-center justify-center rounded-2xl border-2",
                  selected ? "border-accent" : "border-transparent bg-surface-2 text-text-secondary",
                )}
                style={selected ? { background: swatch.light.bg, color: swatch.light.fg } : undefined}
              >
                <IconGlyph name={name} />
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label>Colour</Label>
        <div className="mt-2 flex flex-wrap gap-2.5">
          {colorChoices.map((id) => (
            <button
              key={id}
              type="button"
              aria-label={getSwatch(id).label}
              aria-pressed={color === id}
              onClick={() => onChange({ icon, color: id })}
              className={cn("h-11 w-11 rounded-full border-[3px]", color === id ? "border-accent" : "border-surface")}
              style={{ background: getSwatch(id).light.bg }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
