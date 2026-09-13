"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Wallet } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { loginAction, resendVerificationEmailAction } from "@/actions/auth";
import { Input, Label, FieldError } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { GoogleButton } from "@/components/ui/google-button";
import { LegalNotice } from "@/components/legal-notice";

export default function LoginPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setFormError(null);
    setNeedsVerification(null);
    const result = await loginAction(data);
    if (result.error) {
      setFormError(result.error);
      if (result.needsVerification && result.email) setNeedsVerification(result.email);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  async function handleResend() {
    if (!needsVerification) return;
    setIsResending(true);
    const result = await resendVerificationEmailAction(needsVerification);
    setIsResending(false);
    if (result.error) toast.error(result.error);
    else toast.success("Verification email sent");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-3xl bg-accent text-text-on-accent">
            <Wallet size={20} strokeWidth={2.25} />
          </span>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Welcome back</h1>
            <p className="mt-1 text-sm text-text-secondary">Sign in to keep track of your money.</p>
          </div>
        </div>

        <div className="space-y-4 rounded-3xl bg-surface p-7 shadow-lg">
          {formError && (
            <div className="rounded-2xl bg-error-subtle px-4 py-2.5 text-sm text-error" role="alert">
              {formError}
              {needsVerification && (
                <button type="button" onClick={handleResend} disabled={isResending} className="mt-1 block font-medium underline">
                  {isResending ? "Sending…" : "Resend verification email"}
                </button>
              )}
            </div>
          )}

          <GoogleButton />

          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span className="h-px flex-1 bg-divider" />
            or sign in with email
            <span className="h-px flex-1 bg-divider" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" error={!!errors.email} {...register("email")} />
              <FieldError>{errors.email?.message}</FieldError>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-[0.8125rem] font-medium text-accent-text hover:underline">
                  Forgot password?
                </Link>
              </div>
              <PasswordInput id="password" autoComplete="current-password" placeholder="••••••••" error={!!errors.password} {...register("password")} />
              <FieldError>{errors.password?.message}</FieldError>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-text-secondary">
          New to Spent?{" "}
          <Link href="/register" className="font-medium text-accent-text hover:underline">
            Create an account
          </Link>
        </p>
        <LegalNotice className="mt-4" />
      </div>
    </main>
  );
}
