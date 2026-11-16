import { BackHeader } from "@/components/layout/back-header";
import { CHANGELOG } from "@/lib/changelog";

export default function VersionsPage() {
  return (
    <div className="max-w-2xl space-y-2.5">
      <BackHeader href="/profile/about" title="What's new" className="mb-3.5" />

      {CHANGELOG.map((entry, index) => (
        <section key={entry.version} className="rounded-3xl bg-surface-2 px-4.5 py-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[1.0625rem] font-extrabold text-text-primary">{entry.version}</h2>
            {index === 0 ? (
              <span className="rounded-full bg-accent px-2.5 py-0.75 text-[0.6875rem] font-bold text-text-on-accent">Latest</span>
            ) : (
              <span className="shrink-0 text-xs text-text-secondary">{entry.date}</span>
            )}
          </div>
          <ul className="mt-1.5 space-y-1.5">
            {entry.highlights.map((highlight) => (
              <li key={highlight} className="flex gap-2 text-[0.8125rem] leading-snug text-text-primary">
                <span className="font-extrabold text-accent">-</span>
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
