import { HEAT_WEEKS, type ProfileStats } from "@/lib/data/profile-stats";

const LEVELS = [0, 28, 52, 76, 100];
const level = (count: number) => (count <= 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : count <= 4 ? 3 : 4);
const shade = (percent: number) => (percent === 0 ? "var(--surface)" : `color-mix(in srgb, var(--accent) ${percent}%, var(--surface))`);

/** Twelve weeks of logging, one square a day (columns are weeks, rows Monday to Sunday). */
export function ActivityHeatmap({ heat, activeDays }: Pick<ProfileStats, "heat" | "activeDays">) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-[0.9375rem] font-bold text-text-primary">Your last {HEAT_WEEKS} weeks</p>
        <p className="text-xs font-semibold text-text-secondary">
          {activeDays} active {activeDays === 1 ? "day" : "days"}
        </p>
      </div>
      <div
        className="mt-3 grid grid-flow-col grid-rows-7 gap-1"
        style={{ gridTemplateColumns: `repeat(${HEAT_WEEKS}, minmax(0, 1fr))` }}
        role="img"
        aria-label={`${activeDays} days with a transaction in the last ${HEAT_WEEKS} weeks`}
      >
        {heat.map((d) => (
          <span
            key={d.key}
            title={`${d.key}: ${d.count} ${d.count === 1 ? "transaction" : "transactions"}`}
            className="aspect-square rounded-[5px]"
            style={{ background: shade(LEVELS[level(d.count)]), opacity: d.future ? 0.35 : 1 }}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[0.6875rem] font-semibold text-text-secondary">
        Less
        {LEVELS.map((l) => (
          <span key={l} className="h-3 w-3 rounded-[4px]" style={{ background: shade(l) }} />
        ))}
        More
      </div>
    </div>
  );
}
