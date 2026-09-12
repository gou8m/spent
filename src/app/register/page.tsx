"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Wallet } from "lucide-react";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { registerAction } from "@/actions/auth";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CURRENCIES } from "@/lib/constants";

export default function RegisterPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
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
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-text-on-accent">
            <Wallet size={20} strokeWidth={2.25} />
          </span>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Create your account</h1>
            <p className="mt-1 text-sm text-text-secondary">Free, private, and set up in under a minute.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl border border-border bg-surface p-6 shadow-sm">
          {formError && (
            <div className="rounded-md bg-error-subtle px-3 py-2.5 text-sm text-error" role="alert">
              {formError}
            </div>
          )}

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
            <Input id="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" error={!!errors.password} {...register("password")} />
            <FieldError>{errors.password?.message}</FieldError>
          </div>

          <div>
            <Label htmlFor="currency">Primary currency</Label>
            <select
              id="currency"
              className="h-11 w-full rounded-md border border-border bg-surface px-3.5 text-[0.9375rem] text-text-primary outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent-subtle"
              {...register("currency")}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-accent-text hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
