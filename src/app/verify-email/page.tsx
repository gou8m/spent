import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { verifyEmailAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { AuthStatus } from "@/components/auth/auth-shell";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = token ? await verifyEmailAction(token) : { error: "Missing verification link." };

  const failed = !!result.error;

  return (
    <AuthStatus
      tone={failed ? "error" : "accent"}
      icon={failed ? <XCircle size={44} strokeWidth={2} /> : <CheckCircle2 size={44} strokeWidth={2} />}
      title={failed ? "Verification failed" : "Email verified"}
      actions={
        <Link href="/login" className="block">
          <Button size="lg" className="w-full rounded-[20px] text-[1.0625rem] font-bold">Go to sign in</Button>
        </Link>
      }
    >
      {failed ? result.error : "You can now sign in to your account."}
    </AuthStatus>
  );
}
