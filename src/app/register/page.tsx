"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { registerAction, resendVerificationEmailAction } from "@/actions/auth";
import { Input, Label, FieldError } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { GoogleButton } from "@/components/ui/google-button";
import { LegalNotice } from "@/components/legal-notice";
import { AuthShell, AuthStatus } from "@/components/auth/auth-shell";
import { PasswordStrength } from "@/components/auth/password-strength";
import { CURRENCIES } from "@/lib/constants";
import { latestAdultBirthDate } from "@/lib/age";
import { dialCodeFor, phonePlaceholder } from "@/lib/phone";
import { BirthDateField } from "@/components/ui/birth-date-field";

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
    defaultValues: { currency: "USD", dateOfBirth: "", phone: "" },
  });

  const passwordValue = useWatch({ control, name: "password" });
  const currencyValue = useWatch({ control, name: "currency" });

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
      <AuthStatus
        icon={<MailCheck size={44} strokeWidth={2} />}
        title="Check your email"
        actions={
          <>
            <Button variant="secondary" size="lg" className="w-full rounded-[20px]" onClick={handleResend} loading={isResending} loadingText="Sending…">
              Resend email
            </Button>
            <Link href="/login" className="block py-2 text-center text-[0.9375rem] font-bold text-accent hover:underline">
              Back to sign in
            </Link>
          </>
        }
      >
        We sent a verification link to <span className="font-bold text-text-primary">{submittedEmail}</span>. Click it to activate
        your account.
      </AuthStatus>
    );
  }

  return (
    <AuthShell backHref="/login" title="Create account" subtitle="Takes under a minute. No card needed.">
      {formError && (
        <div className="mt-4 rounded-2xl bg-error-subtle px-4 py-2.5 text-sm text-error" role="alert">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-3.5">
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="dateOfBirth">Date of birth</Label>
            <Controller control={control} name="dateOfBirth" render={({ field }) => <BirthDateField id="dateOfBirth" max={latestAdultBirthDate()} value={field.value} onChange={field.onChange} error={!!errors.dateOfBirth} />} />
          </div>
          <div>
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input id="phone" type="tel" inputMode={dialCodeFor(currencyValue ?? "USD") ? "numeric" : "tel"} autoComplete="tel" placeholder={phonePlaceholder(currencyValue ?? "USD")} error={!!errors.phone} {...register("phone")} />
          </div>
          <div className="col-span-2 -mt-1 empty:hidden">
            <FieldError>{errors.dateOfBirth?.message ?? errors.phone?.message}</FieldError>
            {!errors.dateOfBirth && !errors.phone && <p className="text-xs text-text-secondary">Spent is for people aged 18 or over.</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <PasswordInput id="password" autoComplete="new-password" placeholder="At least 8 characters" error={!!errors.password} {...register("password")} />
          <FieldError>{errors.password?.message}</FieldError>
          <PasswordStrength password={passwordValue ?? ""} />
          {!errors.password && !passwordValue && (
            <p className="mt-1.5 text-xs text-text-secondary">Uppercase, lowercase, a number, and a symbol.</p>
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
          <p className="mt-1.5 text-xs text-text-secondary">Changeable up to 3 times.</p>
        </div>

        <Button type="submit" size="lg" className="w-full rounded-[20px] text-[1.0625rem] font-bold" loading={isSubmitting} loadingText="Creating account…">
          Create account
        </Button>
      </form>

      <div className="my-4 flex items-center gap-3 text-[0.8125rem] font-semibold text-text-secondary">
        <span className="h-px flex-1 bg-divider" />
        or
        <span className="h-px flex-1 bg-divider" />
      </div>
      <GoogleButton />

      <LegalNotice className="mt-4" />
    </AuthShell>
  );
}
