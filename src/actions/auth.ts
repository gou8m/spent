"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/db";
import { signIn, EmailNotVerifiedError } from "@/auth";
import {
  registerSchema,
  loginSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  type RegisterInput,
  type LoginInput,
} from "@/lib/validations/auth";
import { seedNewUserDefaults } from "@/lib/onboard-user";
import { createAndSendVerificationEmail } from "@/lib/email-verification";
import { createAndSendPasswordResetEmail } from "@/lib/password-reset";
import { getOrigin } from "@/lib/origin";

export interface ActionResult {
  error?: string;
}

export async function registerAction(input: RegisterInput): Promise<ActionResult & { needsVerification?: boolean }> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors" };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return { error: "An account with this email already exists" };

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      currency: parsed.data.currency,
    },
  });

  await seedNewUserDefaults(user.id, user.currency);

  try {
    await createAndSendVerificationEmail(user.id, user.email, user.name, await getOrigin());
  } catch (err) {
    console.error("[registerAction] verification email failed to send:", err);
    // The account exists either way — tell the truth about the email instead of a fake "check your inbox".
    return { error: "Account created, but we couldn't send the verification email. Use \"Resend email\" on the login page once email delivery is fixed." };
  }

  return { needsVerification: true };
}

export async function loginAction(
  input: LoginInput,
): Promise<ActionResult & { needsVerification?: boolean; email?: string }> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form for errors" };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    return {};
  } catch (err) {
    if (err instanceof EmailNotVerifiedError) {
      return { error: "Please verify your email before signing in.", needsVerification: true, email: parsed.data.email };
    }
    if (err instanceof AuthError) {
      return { error: "Incorrect email or password" };
    }
    throw err;
  }
}

export async function resendVerificationEmailAction(email: string): Promise<ActionResult> {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) return { error: "No account found for that email" };
  if (user.emailVerified) return { error: "This email is already verified — try signing in" };

  try {
    await createAndSendVerificationEmail(user.id, user.email, user.name, await getOrigin());
  } catch (err) {
    console.error("[resendVerificationEmailAction] failed to send:", err);
    return { error: "Couldn't send that email right now — check email delivery is set up correctly." };
  }
  return {};
}

export async function verifyEmailAction(token: string): Promise<ActionResult> {
  const record = await prisma.emailVerificationToken.findUnique({ where: { token } });
  if (!record) return { error: "This verification link is invalid." };

  if (record.expiresAt < new Date()) {
    await prisma.emailVerificationToken.delete({ where: { id: record.id } });
    return { error: "This verification link has expired." };
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { emailVerified: new Date() } }),
    prisma.emailVerificationToken.deleteMany({ where: { userId: record.userId } }),
  ]);

  return {};
}

/** Confirms a pending email change requested from Profile — the token proves control of the new
 * inbox, so no separate login session is required to land on this link. */
export async function confirmEmailChangeAction(token: string): Promise<ActionResult> {
  const record = await prisma.emailChangeToken.findUnique({ where: { token } });
  if (!record) return { error: "This verification link is invalid." };

  if (record.expiresAt < new Date()) {
    await prisma.emailChangeToken.delete({ where: { id: record.id } });
    return { error: "This verification link has expired." };
  }

  const existing = await prisma.user.findUnique({ where: { email: record.newEmail } });
  if (existing && existing.id !== record.userId) {
    await prisma.emailChangeToken.deleteMany({ where: { userId: record.userId } });
    return { error: "That email is now used by another account." };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { email: record.newEmail, pendingEmail: null, emailVerified: new Date() },
    }),
    prisma.emailChangeToken.deleteMany({ where: { userId: record.userId } }),
  ]);

  return {};
}

/** Always returns success regardless of whether the email is registered — revealing that would let an
 * attacker enumerate accounts by testing addresses against this form. */
export async function requestPasswordResetAction(input: { email: string }): Promise<ActionResult> {
  const parsed = requestPasswordResetSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Enter a valid email" };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (user) {
    try {
      await createAndSendPasswordResetEmail(user.id, user.email, user.name, await getOrigin());
    } catch (err) {
      // Swallowed on purpose: surfacing this would reveal the account exists (this branch only
      // runs when it does), defeating the point of always returning success. Still logged for you.
      console.error("[requestPasswordResetAction] failed to send:", err);
    }
  }

  return {};
}

export async function resetPasswordAction(token: string, input: { password: string }): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form for errors" };

  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record) return { error: "This reset link is invalid." };

  if (record.expiresAt < new Date()) {
    await prisma.passwordResetToken.delete({ where: { id: record.id } });
    return { error: "This reset link has expired." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
  ]);

  return {};
}
