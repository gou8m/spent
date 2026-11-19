import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="animate-fade-in space-y-4" aria-busy="true" aria-label="Loading">
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-11 rounded-sm bg-surface-3" />
        <Skeleton className="h-8 w-40 rounded-xl bg-surface-3" />
      </div>
      <Skeleton className="h-36 w-full rounded-[28px] bg-surface-3" />
      <Skeleton className="h-10 w-72 rounded-full" />
      <Skeleton className="h-80 w-full rounded-[22px]" />
    </div>
  );
}
