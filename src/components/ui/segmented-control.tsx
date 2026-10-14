import { cn } from "@/lib/utils";

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      className={cn("grid gap-1 rounded-[20px] bg-surface-2 p-1", className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "h-10.5 rounded-[16px] px-3 text-sm transition-colors",
            value === opt.value
              ? "bg-accent font-bold text-text-on-accent"
              : "font-semibold text-text-primary hover:text-accent-text",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
