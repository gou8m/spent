"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Wallet, CheckCircle2 } from "lucide-react";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";
import { resetPasswordAction } from "@/actions/auth";
import { Label, FieldError } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";

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
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

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
      <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <span className="mx-auto mb-8 flex h-11 w-11 items-center justify-center rounded-3xl bg-accent text-text-on-accent">
            <Wallet size={20} strokeWidth={2.25} />
          </span>
          <div className="space-y-4 rounded-3xl bg-surface p-7 shadow-lg">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-income-subtle text-income">
              <CheckCircle2 size={28} strokeWidth={2} />
            </span>
            <div>
              <h1 className="text-lg font-bold text-text-primary">Password updated</h1>
              <p className="mt-1 text-sm text-text-secondary">You can now sign in with your new password.</p>
            </div>
            <Button className="w-full" onClick={() => router.push("/login")}>
              Go to sign in
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-3xl bg-accent text-text-on-accent">
            <Wallet size={20} strokeWidth={2.25} />
          </span>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Choose a new password</h1>
            <p className="mt-1 text-sm text-text-secondary">Make it at least 8 characters.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-3xl bg-surface p-7 shadow-lg">
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
            {errors.password ? (
              <FieldError>{errors.password.message}</FieldError>
            ) : (
              <p className="mt-1.5 text-[0.8125rem] text-text-muted">Uppercase, lowercase, a number, and a symbol.</p>
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

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Updating…" : "Update password"}
          </Button>
        </form>
      </div>
    </main>
  );
}
