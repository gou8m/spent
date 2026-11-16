"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";
import { resetPasswordAction } from "@/actions/auth";
import { Label, FieldError } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { AuthShell, AuthStatus } from "@/components/auth/auth-shell";
import { PasswordStrength } from "@/components/auth/password-strength";

// useSearchParams() requires a Suspense boundary in the App Router.
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  const passwordValue = useWatch({ control, name: "password" });

  const onSubmit = async (data: ResetPasswordInput) => {
    setFormError(null);
    setConfirmError(null);

    if (data.password !== confirmPassword) {
      setConfirmError("Passwords don't match");
      return;
    }
    if (!token) {
      setFormError("Missing reset token — request a new link.");
      return;
    }

    const result = await resetPasswordAction(token, data);
    if (result.error) {
      setFormError(result.error);
      return;
    }
    setSucceeded(true);
    toast.success("Password updated");
  };

  if (succeeded) {
    return (
      <AuthStatus
        icon={<CheckCircle2 size={44} strokeWidth={2} />}
        title="Password updated"
        actions={
          <Button size="lg" className="w-full rounded-[20px] text-[1.0625rem] font-bold" onClick={() => router.push("/login")}>
            Go to sign in
          </Button>
        }
      >
        You can now sign in with your new password.
      </AuthStatus>
    );
  }

  return (
    <AuthShell backHref="/login" title="New password" subtitle="Choose a strong password you haven't used before.">
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        {formError && (
          <div className="rounded-2xl bg-error-subtle px-4 py-2.5 text-sm text-error" role="alert">
            {formError}
            {formError.includes("expired") || formError.includes("invalid") ? (
              <Link href="/forgot-password" className="mt-1 block font-medium underline">
                Request a new link
              </Link>
            ) : null}
          </div>
        )}

        <div>
          <Label htmlFor="password">New password</Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            error={!!errors.password}
            {...register("password")}
          />
          <FieldError>{errors.password?.message}</FieldError>
          <PasswordStrength password={passwordValue ?? ""} />
          {!errors.password && !passwordValue && (
            <p className="mt-1.5 text-xs text-text-secondary">Uppercase, lowercase, a number, and a symbol.</p>
          )}
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={!!confirmError}
          />
          <FieldError>{confirmError}</FieldError>
        </div>

        <Button type="submit" size="lg" className="w-full rounded-[20px] text-[1.0625rem] font-bold" loading={isSubmitting} loadingText="Updating…">
          Update password
        </Button>
      </form>
    </AuthShell>
  );
}
