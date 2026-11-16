import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { confirmEmailChangeAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { AuthStatus } from "@/components/auth/auth-shell";

export default async function VerifyEmailChangePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = token ? await confirmEmailChangeAction(token) : { error: "Missing verification link." };

  const failed = !!result.error;

  return (
    <AuthStatus
      tone={failed ? "error" : "accent"}
      icon={failed ? <XCircle size={44} strokeWidth={2} /> : <CheckCircle2 size={44} strokeWidth={2} />}
      title={failed ? "Verification failed" : "Email updated"}
      actions={
        <Link href="/login" className="block">
          <Button size="lg" className="w-full rounded-[20px] text-[1.0625rem] font-bold">Go to sign in</Button>
        </Link>
      }
    >
      {failed ? result.error : "Your new email is confirmed — sign in with it from now on."}
    </AuthStatus>
  );
}
