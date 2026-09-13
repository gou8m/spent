import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link href="/login" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary">
        <ArrowLeft size={16} />
        Back
      </Link>
      <h1 className="text-2xl font-bold text-text-primary">Terms of Service</h1>
      <p className="mt-4 text-sm leading-relaxed text-text-secondary">
        Spent is an independently run personal finance tool. This page is a placeholder — the full
        terms of service have not been finalized yet. Using this app implies you understand it is
        provided as-is, without warranty, while these terms are being written.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-text-secondary">
        Questions in the meantime? Reach out via the contact details on your account.
      </p>
    </main>
  );
}
