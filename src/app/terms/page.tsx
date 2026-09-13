import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LegalPageFooter } from "@/components/legal-page-footer";
import { SUPPORT_EMAIL } from "@/lib/constants";

const LAST_UPDATED = "September 13, 2026";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link href="/login" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary">
        <ArrowLeft size={16} />
        Back
      </Link>
      <h1 className="text-2xl font-bold text-text-primary">Terms of Service</h1>
      <p className="mt-1 text-sm text-text-muted">Last updated {LAST_UPDATED}</p>

      <div className="mt-6 space-y-6 text-sm leading-relaxed text-text-secondary">
        <p>
          Spent (&ldquo;the app,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;) is a personal finance tracker: you manually record
          accounts, transactions, budgets, and goals so you can see where your money goes. By creating an account or using
          Spent, you agree to these terms.
        </p>

        <section>
          <h2 className="text-base font-semibold text-text-primary">What Spent is (and isn&apos;t)</h2>
          <p className="mt-2">
            Spent does not connect to your bank, card, or brokerage accounts, and it does not move, hold, or have access
            to your actual money. Every account balance and transaction in the app is something you (or an import you
            provide) entered by hand. Currency conversion figures shown for cross-currency transfers use a third-party
            exchange-rate feed for reference only and are not guaranteed to match the rate your bank or card issuer
            actually applies.
          </p>
          <p className="mt-2">
            Nothing in Spent is financial, investment, tax, or legal advice — it&apos;s a record-keeping tool. Decisions you
            make based on what you enter or see in the app are your own responsibility.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary">Your account</h2>
          <p className="mt-2">
            You&apos;re responsible for keeping your password confidential and for anything that happens under your
            account. Give us an email address you actually control — some features (verification, password reset,
            security notices) depend on it. One account per person.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary">Acceptable use</h2>
          <p className="mt-2">
            Using Spent to do anything unlawful, to disrupt the service, or to access data that isn&apos;t yours is not
            allowed — see our{" "}
            <Link href="/acceptable-use" className="text-accent-text hover:underline">
              Acceptable Use Policy
            </Link>{" "}
            for specifics. We can suspend or terminate an account that violates it.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary">Your data</h2>
          <p className="mt-2">
            You own the financial data you enter. We don&apos;t claim any rights to it beyond what&apos;s needed to run the
            app and provide support. You can export your transactions as a CSV at any time from Import &amp; export
            in Profile, and you can ask us to delete your account and data — see our{" "}
            <Link href="/privacy" className="text-accent-text hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary">No warranty, limited liability</h2>
          <p className="mt-2">
            Spent is provided &ldquo;as is,&rdquo; without warranty of any kind, and without a guaranteed uptime. To the
            extent the law allows, we&apos;re not liable for indirect, incidental, or consequential damages arising from
            your use of the app — including decisions made based on data you entered incorrectly or a service
            interruption.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary">Changes</h2>
          <p className="mt-2">
            We may update these terms as the app changes. Material changes will update the date above; continuing to
            use Spent after that means you accept the revised terms.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary">Contact</h2>
          <p className="mt-2">
            Questions about these terms:{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-accent-text hover:underline">
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </section>
      </div>

      <LegalPageFooter current="/terms" />
    </main>
  );
}
