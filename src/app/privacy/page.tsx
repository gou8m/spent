import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LegalPageFooter } from "@/components/legal-page-footer";
import { SUPPORT_EMAIL } from "@/lib/constants";

const LAST_UPDATED = "September 15, 2026";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link href="/login" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary">
        <ArrowLeft size={16} />
        Back
      </Link>
      <h1 className="text-2xl font-bold text-text-primary">Privacy Policy</h1>
      <p className="mt-1 text-sm text-text-muted">Last updated {LAST_UPDATED}</p>

      <div className="mt-6 space-y-6 text-sm leading-relaxed text-text-secondary">
        <p>
          This explains what Spent collects, why, and who else sees it. We don&apos;t sell your data, and we don&apos;t run
          ads or analytics trackers in the app.
        </p>

        <section>
          <h2 className="text-base font-semibold text-text-primary">What we collect</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li><strong className="text-text-primary">Account info</strong> — name, email address, and password (we store a one-way hash, never the password itself). Also a preset icon you choose to represent your account.</li>
            <li><strong className="text-text-primary">Google sign-in</strong> — if you use &ldquo;Continue with Google&rdquo; instead of a password, we receive your name, email, and whether Google has verified that email. We never see your Google password.</li>
            <li><strong className="text-text-primary">Financial data you enter</strong> — accounts, transactions, categories, budgets, goals, and recurring rules you create, or restore from a backup file. This is manually entered by you; Spent has no bank or card integration and doesn&apos;t fetch this from anywhere else.</li>
            <li><strong className="text-text-primary">Preferences</strong> — your primary currency, theme (light/dark), and similar settings.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary">How we use it</h2>
          <p className="mt-2">
            Solely to run the app for you: showing your data back to you, sending account emails you&apos;ve triggered
            (email verification, password reset, email-change confirmation), and calculating things like balances,
            budget progress, and reports. We don&apos;t use your data for advertising, and we don&apos;t build any profile of
            you beyond what the app needs to function.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary">Who else sees it</h2>
          <p className="mt-2">A few service providers process data on our behalf, strictly to run the app:</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li><strong className="text-text-primary">Supabase</strong> — hosts our database (in Seoul, South Korea), where your account and financial data live.</li>
            <li><strong className="text-text-primary">Vercel</strong> — hosts the app itself.</li>
            <li><strong className="text-text-primary">Resend</strong> — delivers our transactional emails (verification, password reset).</li>
            <li><strong className="text-text-primary">Google</strong> — only if you choose to sign in with Google.</li>
            <li><strong className="text-text-primary">Frankfurter (ECB exchange rates)</strong> — when you record a transfer between accounts in different currencies, we look up a reference rate by currency code only; no personal or account data is sent.</li>
          </ul>
          <p className="mt-2">We don&apos;t sell or rent your data to anyone, for any reason.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary">Cookies</h2>
          <p className="mt-2">
            Spent sets one essential cookie to keep you signed in. There are no advertising or analytics cookies, and
            no cross-site tracking.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary">Security</h2>
          <p className="mt-2">
            Passwords are hashed (never stored in plain text), all traffic is encrypted in transit (HTTPS), and access
            to the database is restricted to the app itself. No system is perfectly secure, but we don&apos;t take
            shortcuts on the basics.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary">Your data, your choices</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li><strong className="text-text-primary">Export</strong> — download a full backup of your data anytime from Backup &amp; restore in Profile.</li>
            <li><strong className="text-text-primary">Correct</strong> — edit your name, email, currency, and entries directly in the app.</li>
            <li><strong className="text-text-primary">Delete</strong> — email us at{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-accent-text hover:underline">{SUPPORT_EMAIL}</a>{" "}
              to have your account and all associated data permanently deleted. There&apos;s no self-serve delete button yet — we process these by hand.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary">Data retention</h2>
          <p className="mt-2">
            We keep your data for as long as your account is active. If you ask us to delete your account, we remove
            it (and everything linked to it — accounts, transactions, categories, and so on) from our production
            database; backups age out on their normal schedule afterward.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary">Children</h2>
          <p className="mt-2">Spent isn&apos;t directed at children, and we don&apos;t knowingly collect data from anyone under 16.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary">Changes</h2>
          <p className="mt-2">
            If this policy changes materially, we&apos;ll update the date above. Continuing to use Spent afterward means
            you accept the revised policy.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text-primary">Contact</h2>
          <p className="mt-2">
            Questions, requests, or concerns about your data:{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-accent-text hover:underline">{SUPPORT_EMAIL}</a>.
          </p>
        </section>
      </div>

      <LegalPageFooter current="/privacy" />
    </main>
  );
}
