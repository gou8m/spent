import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LegalPageFooter } from "@/components/legal-page-footer";
import { SUPPORT_EMAIL } from "@/lib/constants";

const LAST_UPDATED = "September 14, 2026";

export default function AcceptableUsePage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link href="/login" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary">
        <ArrowLeft size={16} />
        Back
      </Link>
      <h1 className="text-2xl font-bold text-text-primary">Acceptable Use Policy</h1>
      <p className="mt-1 text-sm text-text-muted">Last updated {LAST_UPDATED}</p>

      <div className="mt-6 space-y-4 text-sm leading-relaxed text-text-secondary">
        <p>Keep it simple: use Spent to track your own finances, and don&apos;t use it to harm the service or anyone else. Specifically, don&apos;t:</p>

        <ul className="list-disc space-y-2 pl-5">
          <li>Use Spent for anything unlawful, or to store or process data you don&apos;t have the right to.</li>
          <li>Try to gain unauthorized access to another user&apos;s account or data, or probe/scan the service for vulnerabilities without our permission.</li>
          <li>Disrupt the service — excessive automated requests, scraping, denial-of-service attempts, or anything that degrades it for other users.</li>
          <li>Enter transaction titles or notes containing illegal, abusive, or harassing content.</li>
          <li>Misrepresent your identity, or create an account impersonating someone else.</li>
          <li>Attempt to circumvent rate limits, account restrictions, or other safeguards we put in place.</li>
        </ul>

        <p>
          Spent is meant for personal, individual use — one account per person. If you need something outside these
          bounds (bulk access, integration, research use), contact us first rather than assuming it&apos;s fine.
        </p>

        <p>
          Violating this policy may result in a warning, suspension, or termination of your account, depending on
          severity. See our{" "}
          <Link href="/terms" className="text-accent-text hover:underline">Terms of Service</Link> for the broader
          agreement this sits under.
        </p>

        <p>
          To report abuse or a security concern:{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-accent-text hover:underline">{SUPPORT_EMAIL}</a>.
        </p>
      </div>

      <LegalPageFooter current="/acceptable-use" />
    </main>
  );
}
