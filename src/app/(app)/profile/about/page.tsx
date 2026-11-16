import Link from "next/link";
import { ChevronRight, Sparkles, FileText, ShieldCheck, Scale, Mail } from "lucide-react";
import { BackHeader } from "@/components/layout/back-header";
import { APP_VERSION, SUPPORT_EMAIL } from "@/lib/constants";

const ROWS = [
  { href: "/profile/about/versions", icon: Sparkles, label: "What's new", caption: "Release notes and fixes" },
  { href: "/terms", icon: FileText, label: "Terms of service" },
  { href: "/privacy", icon: ShieldCheck, label: "Privacy policy" },
  { href: "/acceptable-use", icon: Scale, label: "Acceptable use" },
  { href: "/contact", icon: Mail, label: "Contact" },
];

export default function AboutPage() {
  return (
    <div className="max-w-2xl space-y-3.5">
      <BackHeader href="/profile" title="About" />

      <section className="rounded-[28px] p-6 text-hero-text" style={{ background: "var(--hero-gradient)" }}>
        <p className="text-[2.75rem] font-extrabold leading-none tracking-[-1.5px] text-accent">Spent.</p>
        <p className="mt-1 text-sm font-bold text-hero-text-secondary">Version {APP_VERSION}</p>
        <p className="mt-2 text-sm leading-snug">
          A straightforward way to track where your money goes: accounts, budgets, goals and recurring bills in one place,
          without the clutter.
        </p>
      </section>

      <ul className="flex flex-col gap-2">
        {ROWS.map(({ href, icon: Icon, label, caption }) => (
          <li key={href}>
            <Link href={href} className="flex items-center gap-3.5 rounded-[22px] bg-surface-2 px-4 py-3 transition-colors hover:bg-surface-3">
              <span className="flex h-11.5 w-11.5 shrink-0 items-center justify-center rounded-[14px] bg-surface text-accent">
                <Icon size={22} strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold text-text-primary">{label}</span>
                {caption && <span className="mt-0.5 block text-xs text-text-secondary">{caption}</span>}
              </span>
              <ChevronRight size={20} strokeWidth={2} className="shrink-0 text-text-secondary" />
            </Link>
          </li>
        ))}
      </ul>

      <p className="px-1 text-[0.8125rem] leading-snug text-text-secondary">
        I built Spent to track my own spending without fighting a bloated app to do it. It is still evolving. If something
        feels off or you would like a feature, write to{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="font-bold text-accent hover:underline">
          {SUPPORT_EMAIL}
        </a>
        .
      </p>
    </div>
  );
}
