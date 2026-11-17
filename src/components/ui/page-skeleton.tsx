import { Skeleton } from "@/components/ui/skeleton";

/**
 * A generic route skeleton: header row, optional hero card and filter chips, then list rows. Each
 * route's loading.tsx uses this so moving between screens shows the right outline straight away
 * (instead of every screen briefly showing the Home outline), and the page does not jump when the
 * real content replaces it.
 */
export function PageSkeleton({ hero = false, chips = false, rows = 5 }: { hero?: boolean; chips?: boolean; rows?: number }) {
  return (
    <div className="animate-fade-in space-y-5" aria-busy="true" aria-label="Loading">
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-11 rounded-sm bg-surface-3" />
        <Skeleton className="h-8 w-40 rounded-xl bg-surface-3" />
      </div>
      {hero && <Skeleton className="h-36 w-full rounded-[28px] bg-surface-3" />}
      {chips && (
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-24 shrink-0 rounded-full" />
          ))}
        </div>
      )}
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-19 w-full rounded-[22px]" />
        ))}
      </div>
    </div>
  );
}
