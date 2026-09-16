import { Card } from "@/components/ui/card";
import { CHANGELOG } from "@/lib/changelog";

export default function VersionsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary sm:text-2xl">What&apos;s new</h1>
        <p className="mt-1 text-sm text-text-secondary">A simple history of what&apos;s shipped in Spent, version by version.</p>
      </div>

      <div className="space-y-4">
        {CHANGELOG.map((entry) => (
          <Card key={entry.version} className="p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-semibold text-text-primary">Version {entry.version}</h2>
              <span className="shrink-0 text-xs text-text-muted">{entry.date}</span>
            </div>
            <ul className="mt-2.5 space-y-1.5">
              {entry.highlights.map((highlight) => (
                <li key={highlight} className="flex gap-2 text-sm leading-relaxed text-text-secondary">
                  <span className="text-text-muted">•</span>
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
