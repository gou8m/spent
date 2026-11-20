import { BackHeader } from "@/components/layout/back-header";
import { LegalPageFooter } from "@/components/legal-page-footer";
import { SUPPORT_EMAIL } from "@/lib/constants";

const LAST_UPDATED = "November 21, 2026";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 pb-12 pt-7 sm:px-6">
      <BackHeader href="/login" title="Privacy Policy" />
      <p className="mt-3.5 text-[0.8125rem] text-text-secondary">Last updated {LAST_UPDATED}</p>

      <div className="mt-4.5 space-y-5 text-sm leading-relaxed text-text-primary">
        <p>
          This explains what Spent collects, why, and who else sees it. We don&apos;t sell your data, and we don&apos;t run
          ads or analytics trackers in the app.
        </p>

        <section>
          <h2 className="text-lg font-bold tracking-tight text-text-primary">What we collect</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li><strong className="text-text-primary">Account info</strong> — name, email address, and password (we store a one-way hash, never the password itself). Also the preset picture you choose for your account.</li>
            <li><strong className="text-text-primary">Date of birth and phone</strong> — Spent is for people aged 18 or over, so we ask your date of birth to confirm that and to send you a birthday wish by email and notification. A phone number is optional. We never share either.</li>
            <li><strong className="text-text-primary">Google sign-in</strong> — if you use &ldquo;Continue with Google&rdquo; instead of a password, we receive your name, email, and whether Google has verified that email. We never see your Google password.</li>
            <li><strong className="text-text-primary">Financial data you enter</strong> — accounts, transactions (titles, amounts, dates, notes, tags), categories, budgets, goals, recurring bills, shared-expense groups (including the names you type for the people in them, who may never use Spent), and loans (including who they are with and due dates) that you create, or restore from a backup file. This is manually entered by you; Spent has no bank or card integration and doesn&apos;t fetch this from anywhere else.</li>
            <li><strong className="text-text-primary">Preferences</strong> — your primary currency, theme (light/dark and color), notification choices, and which in-app notifications you have already seen.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold tracking-tight text-text-primary">How we use it</h2>
          <p className="mt-2">
            Solely to run the app for you: showing your data back to you, sending account emails you&apos;ve triggered
            (email verification, password reset, email-change confirmation), and calculating things like balances,
            budget progress, reports, in-app reminders, budget warnings, and category suggestions. Reminders are shown inside
            the app only; we do not send push, SMS, or reminder emails. We don&apos;t use your data for advertising, and we don&apos;t build any profile of
            you beyond what the app needs to function.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold tracking-tight text-text-primary">Who else sees it</h2>
          <p className="mt-2">A few service providers process data on our behalf, strictly to run the app:</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li><strong className="text-text-primary">Supabase</strong> — hosts our database (in Seoul, South Korea), where your account and financial data live.</li>
            <li><strong className="text-text-primary">Vercel</strong> — hosts the app itself.</li>
            <li><strong className="text-text-primary">Resend</strong> — delivers our transactional emails (verification, password reset).</li>
            <li><strong className="text-text-primary">Google</strong> — if you choose to sign in with Google. Our emails also load the Plus Jakarta Sans font from Google Fonts, so your email app may contact Google when it displays one.</li>
            <li><strong className="text-text-primary">Frankfurter (ECB exchange rates)</strong> — when you record a transfer between accounts in different currencies, we look up a reference rate by currency code only; no personal or account data is sent.</li>
          </ul>
          <p className="mt-2">We don&apos;t sell or rent your data to anyone, for any reason.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold tracking-tight text-text-primary">Cookies</h2>
          <p className="mt-2">
            Spent sets one essential cookie to keep you signed in. Your browser&apos;s local storage also keeps small interface
            preferences, such as your theme and whether you dismissed the Get started checklist or the first-time guide.
            For speed, your browser also keeps screens you opened in the last few minutes in its memory (cache), so going back
            to one is instant; saving anything clears them, and closing the app empties that memory. Neither holds your
            account password. There are no advertising or analytics cookies, and no cross-site tracking.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold tracking-tight text-text-primary">Security</h2>
          <p className="mt-2">
            Passwords are hashed (never stored in plain text), all traffic is encrypted in transit (HTTPS), and access
            to the database is restricted to the app itself. No system is perfectly secure, but we don&apos;t take
            shortcuts on the basics.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold tracking-tight text-text-primary">Your data, your choices</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li><strong className="text-text-primary">Export</strong> — download a full backup of your data anytime from Settings &rarr; Backup &amp; restore, or a PDF statement for a period you choose from Settings &rarr; Data. Statements are generated on request and we do not store them.</li>
            <li><strong className="text-text-primary">Correct</strong> — edit your name, email, currency, and entries directly in the app.</li>
            <li><strong className="text-text-primary">Clear</strong> — wipe all your financial data yourself from Settings &rarr; Backup &amp; restore &rarr; Clear all data. Your login and settings stay.</li>
            <li><strong className="text-text-primary">Delete</strong> — email us at{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-accent-text hover:underline">{SUPPORT_EMAIL}</a>{" "}
              to have your account and all associated data permanently deleted. There is no in-app button for deleting the account itself yet — we process these requests by hand.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold tracking-tight text-text-primary">Data retention</h2>
          <p className="mt-2">
            We keep your data for as long as your account is active. If you ask us to delete your account, we remove
            it (and everything linked to it — accounts, transactions, categories, and so on) from our production
            database; backups age out on their normal schedule afterward.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold tracking-tight text-text-primary">Children</h2>
          <p className="mt-2">Spent isn&apos;t directed at children, and we don&apos;t knowingly collect data from anyone under 16.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold tracking-tight text-text-primary">Changes</h2>
          <p className="mt-2">
            If this policy changes materially, we&apos;ll update the date above. Continuing to use Spent afterward means
            you accept the revised policy.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold tracking-tight text-text-primary">Contact</h2>
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
