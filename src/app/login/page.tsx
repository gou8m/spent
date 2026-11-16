"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { loginAction, resendVerificationEmailAction } from "@/actions/auth";
import { Input, Label, FieldError } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { GoogleButton } from "@/components/ui/google-button";
import { AuthShell } from "@/components/auth/auth-shell";

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
    <AuthShell hero>
      <h1 className="mt-18 text-[1.625rem] font-extrabold tracking-[-0.8px] text-text-primary">Welcome back</h1>

      {formError && (
        <div className="mt-4 rounded-2xl bg-error-subtle px-4 py-2.5 text-sm text-error" role="alert">
          {formError}
          {needsVerification && (
            <button type="button" onClick={handleResend} disabled={isResending} className="mt-1 block font-medium underline">
              {isResending ? "Sending…" : "Resend verification email"}
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" error={!!errors.email} {...register("email")} />
          <FieldError>{errors.email?.message}</FieldError>
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <PasswordInput id="password" autoComplete="current-password" placeholder="••••••••" error={!!errors.password} {...register("password")} />
          <FieldError>{errors.password?.message}</FieldError>
        </div>

        <div className="text-right">
          <Link href="/forgot-password" className="text-sm font-bold text-accent hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" size="lg" className="w-full rounded-[20px] text-[1.0625rem] font-bold" loading={isSubmitting} loadingText="Signing in…">
          Sign in
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-[0.8125rem] font-semibold text-text-secondary">
        <span className="h-px flex-1 bg-divider" />
        or
        <span className="h-px flex-1 bg-divider" />
      </div>

      <GoogleButton />

      <p className="mt-6 text-center text-[0.9375rem] text-text-secondary">
        New to Spent?{" "}
        <Link href="/register" className="font-bold text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
