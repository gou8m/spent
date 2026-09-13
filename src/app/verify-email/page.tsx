import Link from "next/link";
import { CheckCircle2, XCircle, Wallet } from "lucide-react";
import { verifyEmailAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = token ? await verifyEmailAction(token) : { error: "Missing verification link." };

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-12">
      <div className="w-full max-w-sm text-center">
        <span className="mx-auto mb-8 flex h-11 w-11 items-center justify-center rounded-3xl bg-accent text-text-on-accent">
          <Wallet size={20} strokeWidth={2.25} />
        </span>

        <div className="space-y-4 rounded-3xl bg-surface p-7 shadow-lg">
          {result.error ? (
            <>
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-error-subtle text-error">
                <XCircle size={28} strokeWidth={2} />
              </span>
              <div>
                <h1 className="text-lg font-bold text-text-primary">Verification failed</h1>
                <p className="mt-1 text-sm text-text-secondary">{result.error}</p>
              </div>
            </>
          ) : (
            <>
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-income-subtle text-income">
                <CheckCircle2 size={28} strokeWidth={2} />
              </span>
              <div>
                <h1 className="text-lg font-bold text-text-primary">Email verified</h1>
                <p className="mt-1 text-sm text-text-secondary">You can now sign in to your account.</p>
              </div>
            </>
          )}
          <Link href="/login">
            <Button className="w-full">Go to sign in</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
