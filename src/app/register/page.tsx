"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Wallet, MailCheck } from "lucide-react";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { registerAction, resendVerificationEmailAction } from "@/actions/auth";
import { Input, Label, FieldError } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { GoogleButton } from "@/components/ui/google-button";
import { LegalNotice } from "@/components/legal-notice";
import { CURRENCIES } from "@/lib/constants";

export default function RegisterPage() {
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { currency: "USD" },
  });

  const onSubmit = async (data: RegisterInput) => {
    setFormError(null);
    const result = await registerAction(data);
    if (result.error) {
      setFormError(result.error);
      return;
    }
    setSubmittedEmail(data.email);
  };

  async function handleResend() {
    if (!submittedEmail) return;
    setIsResending(true);
    const result = await resendVerificationEmailAction(submittedEmail);
    setIsResending(false);
    if (result.error) toast.error(result.error);
    else toast.success("Verification email sent");
  }

  if (submittedEmail) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <span className="mx-auto mb-8 flex h-11 w-11 items-center justify-center rounded-3xl bg-accent text-text-on-accent">
            <Wallet size={20} strokeWidth={2.25} />
          </span>
          <div className="space-y-4 rounded-3xl bg-surface p-7 shadow-lg">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-subtle text-accent-text">
              <MailCheck size={28} strokeWidth={2} />
            </span>
            <div>
              <h1 className="text-lg font-bold text-text-primary">Check your email</h1>
              <p className="mt-1 text-sm text-text-secondary">
                We sent a verification link to <span className="font-medium text-text-primary">{submittedEmail}</span>. Click it
                to activate your account.
              </p>
            </div>
            <Button variant="outline" className="w-full" onClick={handleResend} disabled={isResending}>
              {isResending ? "Sending…" : "Resend email"}
            </Button>
          </div>
          <p className="mt-6 text-center text-sm text-text-secondary">
            <Link href="/login" className="font-medium text-accent-text hover:underline">
              Back to sign in
            </Link>
          </p>
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
            <h1 className="text-xl font-bold text-text-primary">Create your account</h1>
            <p className="mt-1 text-sm text-text-secondary">Free, private, and set up in under a minute.</p>
          </div>
        </div>

        <div className="space-y-4 rounded-3xl bg-surface p-7 shadow-lg">
          {formError && (
            <div className="rounded-2xl bg-error-subtle px-4 py-2.5 text-sm text-error" role="alert">
              {formError}
            </div>
          )}

          <GoogleButton />

          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span className="h-px flex-1 bg-divider" />
            or sign up with email
            <span className="h-px flex-1 bg-divider" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" autoComplete="name" placeholder="Alex Morgan" error={!!errors.name} {...register("name")} />
              <FieldError>{errors.name?.message}</FieldError>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" error={!!errors.email} {...register("email")} />
              <FieldError>{errors.email?.message}</FieldError>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <PasswordInput id="password" autoComplete="new-password" placeholder="At least 8 characters" error={!!errors.password} {...register("password")} />
              {errors.password ? (
                <FieldError>{errors.password.message}</FieldError>
              ) : (
                <p className="mt-1.5 text-[0.8125rem] text-text-muted">Uppercase, lowercase, a number, and a symbol.</p>
              )}
            </div>

            <div>
              <Label htmlFor="currency">Primary currency</Label>
              <Controller
                control={control}
                name="currency"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.code} — {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating account…" : "Create account"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-accent-text hover:underline">
            Sign in
          </Link>
        </p>
        <LegalNotice className="mt-4" />
        <p className="mt-2 text-center text-xs text-text-muted">
          <Link href="/contact" className="underline hover:text-text-secondary">
            Contact us
          </Link>
        </p>
      </div>
    </main>
  );
}
