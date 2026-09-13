import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { LegalPageFooter } from "@/components/legal-page-footer";
import { SUPPORT_EMAIL } from "@/lib/constants";

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link href="/login" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary">
        <ArrowLeft size={16} />
        Back
      </Link>
      <h1 className="text-2xl font-bold text-text-primary">Contact us</h1>
      <p className="mt-3 text-sm leading-relaxed text-text-secondary">
        Questions, feedback, a bug you ran into, or a request about your account or data — all of it goes to the same
        place. We read every email and reply from a real person, not a ticket bot.
      </p>

      <div className="mt-6 flex flex-col items-start gap-3 rounded-3xl bg-surface p-6 shadow-md sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-text-primary">Email</p>
          <p className="mt-0.5 text-sm text-text-secondary">{SUPPORT_EMAIL}</p>
        </div>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-text-on-accent shadow-sm transition-colors hover:bg-accent-hover"
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
