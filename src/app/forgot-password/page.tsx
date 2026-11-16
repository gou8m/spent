"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { requestPasswordResetSchema, type RequestPasswordResetInput } from "@/lib/validations/auth";
import { requestPasswordResetAction } from "@/actions/auth";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthShell, AuthStatus } from "@/components/auth/auth-shell";

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
      <AuthStatus
        icon={<MailCheck size={44} strokeWidth={2} />}
        title="Check your email"
        actions={
          <Link href="/login" className="block py-2 text-center text-[0.9375rem] font-bold text-accent hover:underline">
            Back to sign in
          </Link>
        }
      >
        If an account exists for that email, we sent a link to reset your password. It expires in 1 hour.
      </AuthStatus>
    );
  }

  return (
    <AuthShell backHref="/login" title="Forgot password?" subtitle="Enter your email and we'll send you a reset link.">
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" error={!!errors.email} {...register("email")} />
          <FieldError>{errors.email?.message}</FieldError>
        </div>

        <Button type="submit" size="lg" className="w-full rounded-[20px] text-[1.0625rem] font-bold" loading={isSubmitting} loadingText="Sending…">
          Send reset link
        </Button>
      </form>
    </AuthShell>
  );
}
