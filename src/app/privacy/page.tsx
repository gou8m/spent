import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link href="/login" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary">
        <ArrowLeft size={16} />
        Back
      </Link>
      <h1 className="text-2xl font-bold text-text-primary">Privacy Policy</h1>
      <p className="mt-4 text-sm leading-relaxed text-text-secondary">
        This page is a placeholder — the full privacy policy has not been finalized yet. Spent
        stores the financial data you enter (transactions, accounts, budgets, and similar) to
        provide the app&apos;s features, and does not sell your data to third parties.
      </p>
    </main>
  );
}
