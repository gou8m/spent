import Link from "next/link";
import { Plus } from "lucide-react";
import { getIcon } from "@/lib/icons";

type Goal = { id: string; name: string; icon: string; color: string };

const TILE_BACKGROUNDS = ["bg-sky text-sky-text", "bg-accent-subtle text-accent-hover"];

export function QuickGoals({ goals }: { goals: Goal[] }) {
  return (
    <div>
      <h2 className="text-[1.375rem] font-bold tracking-tight text-text-primary">Quick Goals</h2>

      {goals.length === 0 ? (
        <Link
          href="/goals"
          className="mt-3.5 flex h-16 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-accent-border text-sm font-bold text-text-secondary transition-colors hover:bg-surface-2"
        >
          <Plus size={20} strokeWidth={2} />
          Create your first goal
        </Link>
      ) : (
        <div className="no-scrollbar -mr-5 mt-3.5 flex gap-3 overflow-x-auto pb-1">
          {goals.map((goal, i) => {
            const Icon = getIcon(goal.icon);
            return (
              <Link
                key={goal.id}
                href="/goals"
                className={`flex h-24 w-42 shrink-0 flex-col justify-between rounded-lg p-4 ${TILE_BACKGROUNDS[i % TILE_BACKGROUNDS.length]}`}
              >
                <Icon size={24} strokeWidth={2} />
                <span className="truncate text-[0.9375rem] font-semibold">{goal.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
