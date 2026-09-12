import type * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 px-6 py-14 text-center", className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-text-muted">
        <Icon size={24} strokeWidth={1.75} />
      </div>
      <div className="space-y-1">
        <p className="text-[0.9375rem] font-semibold text-text-primary">{title}</p>
        <p className="mx-auto max-w-sm text-sm text-text-secondary">{description}</p>
      </div>
      {action}
    </div>
  );
}
