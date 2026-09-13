import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AcceptableUsePage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link href="/login" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary">
        <ArrowLeft size={16} />
        Back
      </Link>
      <h1 className="text-2xl font-bold text-text-primary">Acceptable Use Policy</h1>
      <p className="mt-4 text-sm leading-relaxed text-text-secondary">
        This page is a placeholder — the full acceptable-use policy has not been finalized yet. In
        short: don&apos;t use Spent to store or process data you don&apos;t have the right to, don&apos;t attempt
        to disrupt or abuse the service, and don&apos;t use it for anything unlawful.
      </p>
    </main>
  );
}
