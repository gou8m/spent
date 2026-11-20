"use server";

import { parseBirthDate } from "@/lib/age";
import { normalizePhone } from "@/lib/phone";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/db";
import { signIn, EmailNotVerifiedError, TooManyAttemptsError } from "@/auth";
import { TOO_MANY_ATTEMPTS, clientIp, withinRateLimit } from "@/lib/rate-limit";
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

  // Sign-ups per address are limited (5 an hour) so the form cannot be used to flood inboxes or fill the database.
  if (!(await withinRateLimit(`register:ip:${await clientIp()}`, 5, 3600))) return { error: TOO_MANY_ATTEMPTS };

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return { error: "An account with this email already exists" };

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      currency: parsed.data.currency,
      dateOfBirth: parseBirthDate(parsed.data.dateOfBirth),
      phone: parsed.data.phone ? normalizePhone(parsed.data.phone, parsed.data.currency) || null : null,
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
    if (err instanceof TooManyAttemptsError) {
      return { error: TOO_MANY_ATTEMPTS };
    }
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
  const normalized = email.trim().toLowerCase();
  if (!(await withinRateLimit(`resend:email:${normalized}`, 3, 3600)) || !(await withinRateLimit(`resend:ip:${await clientIp()}`, 10, 3600))) {
    return { error: TOO_MANY_ATTEMPTS };
  }

  // Same answer whether or not the address has an account (or is already verified), so this form cannot
  // be used to find out who is registered.
  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user || user.emailVerified) return {};

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

  // Limited per address and per sender; going over the limit looks identical to success so nothing is revealed.
  const withinLimit =
    (await withinRateLimit(`reset:email:${parsed.data.email}`, 3, 3600)) && (await withinRateLimit(`reset:ip:${await clientIp()}`, 10, 3600));
  const user = withinLimit ? await prisma.user.findUnique({ where: { email: parsed.data.email } }) : null;
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
