import { Skeleton } from "@/components/ui/skeleton";

/** Route-level skeleton: the same shapes as the final Home screen (title, hero card,
 * goal tiles, list rows) so the page does not jump when real content arrives. */
export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-9 w-32 rounded-xl bg-surface-3" />
      <Skeleton className="h-44 w-full rounded-[28px] bg-surface-3" />
      <div className="space-y-3.5">
        <Skeleton className="h-6 w-36 rounded-lg" />
        <div className="flex gap-3 overflow-hidden">
          <Skeleton className="h-24 w-42 shrink-0 rounded-[22px]" />
          <Skeleton className="h-24 w-42 shrink-0 rounded-[22px]" />
          <Skeleton className="h-24 w-42 shrink-0 rounded-[22px]" />
        </div>
      </div>
      <div className="space-y-3.5">
        <Skeleton className="h-6 w-48 rounded-lg" />
        <div className="space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-19 w-full rounded-[22px]" />
          ))}
        </div>
      </div>
    </div>
  );
}
