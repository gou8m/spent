"use client";

import { SlidingTabs } from "@/components/ui/sliding-tabs";

/** Equal-width options in a rounded track; the green bubble glides between them. */
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
  return <SlidingTabs variant="filled" equal options={options} value={value} onChange={onChange} className={className} />;
}
