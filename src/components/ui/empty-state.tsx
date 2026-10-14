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
    <div className={cn("flex flex-col items-center justify-center gap-5 px-6 py-16 text-center", className)}>
      <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-accent-subtle text-accent-hover">
        <Icon size={44} strokeWidth={1.75} />
      </div>
      <div className="space-y-2">
        <p className="text-[1.375rem] font-extrabold tracking-tight text-text-primary">{title}</p>
        <p className="mx-auto max-w-[270px] text-sm leading-relaxed text-text-secondary">{description}</p>
      </div>
      {action}
    </div>
  );
}
