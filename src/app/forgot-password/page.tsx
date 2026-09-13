"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Wallet, MailCheck } from "lucide-react";
import { requestPasswordResetSchema, type RequestPasswordResetInput } from "@/lib/validations/auth";
import { requestPasswordResetAction } from "@/actions/auth";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RequestPasswordResetInput>({ resolver: zodResolver(requestPasswordResetSchema) });

  const onSubmit = async (data: RequestPasswordResetInput) => {
    await requestPasswordResetAction(data);
    setSubmitted(true);
  };

  if (submitted) {
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
                If an account exists for that email, we sent a link to reset your password. It expires in 1 hour.
              </p>
            </div>
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
            <h1 className="text-xl font-bold text-text-primary">Forgot your password?</h1>
            <p className="mt-1 text-sm text-text-secondary">Enter your email and we&apos;ll send you a reset link.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-3xl bg-surface p-7 shadow-lg">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" error={!!errors.email} {...register("email")} />
            <FieldError>{errors.email?.message}</FieldError>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Sending…" : "Send reset link"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          <Link href="/login" className="font-medium text-accent-text hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
