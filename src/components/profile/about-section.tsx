import { Card } from "@/components/ui/card";
import { APP_VERSION, SUPPORT_EMAIL } from "@/lib/constants";

export function AboutSection() {
  return (
    <div>
      <h2 className="mb-2 px-1 text-[0.8125rem] font-semibold uppercase tracking-wide text-text-muted">About</h2>
      <Card className="divide-y divide-divider p-0">
        <div className="px-4 py-3.5">
          <p className="text-sm font-semibold text-text-primary">Spent</p>
          <p className="mt-1 text-sm leading-relaxed text-text-secondary">
            A straightforward way to track where your money goes — accounts, budgets, goals, and recurring bills
            in one place, without the clutter.
          </p>
        </div>
        <div className="px-4 py-3.5">
          <p className="text-[0.8125rem] font-semibold uppercase tracking-wide text-text-muted">A note from the developer</p>
          <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
            I built Spent to track my own spending without fighting a bloated app to do it. It&apos;s still
            evolving — if something feels off or you&apos;d like a feature, reach out at{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="underline hover:text-text-secondary">
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </div>
        <div className="flex items-center justify-between px-4 py-3.5">
          <span className="text-sm font-medium text-text-primary">Version</span>
          <span className="text-sm text-text-secondary">{APP_VERSION}</span>
        </div>
      </Card>
    </div>
  );
}
