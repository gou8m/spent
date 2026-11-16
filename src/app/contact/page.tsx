import { Mail } from "lucide-react";
import { BackHeader } from "@/components/layout/back-header";
import { LegalPageFooter } from "@/components/legal-page-footer";
import { SUPPORT_EMAIL } from "@/lib/constants";

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 pb-12 pt-7 sm:px-6">
      <BackHeader href="/login" title="Contact" />
      <p className="mt-3.5 text-sm leading-snug text-text-secondary">
        Questions, feedback, a bug you ran into, or a request about your account or data — all of it goes to the same
        place. We read every email and reply from a real person, not a ticket bot.
      </p>

      <div className="mt-6 flex flex-col items-start gap-3 rounded-3xl bg-surface-2 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-text-primary">Email</p>
          <p className="mt-0.5 text-sm text-text-secondary">{SUPPORT_EMAIL}</p>
        </div>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="inline-flex h-13 items-center justify-center gap-2 rounded-[18px] bg-accent px-5 text-[0.9375rem] font-bold text-text-on-accent transition-colors hover:bg-accent-hover"
        >
          <Mail size={16} strokeWidth={2.25} />
          Email us
        </a>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-text-secondary">
        Reporting a security issue? Please email us directly rather than filing it publicly — we&apos;ll acknowledge and
        fix it as quickly as we can.
      </p>

      <LegalPageFooter current="/contact" />
    </main>
  );
}
