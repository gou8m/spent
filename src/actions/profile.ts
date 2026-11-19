"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth-helpers";
import {
  nameSchema,
  avatarPresetSchema,
  emailChangeSchema,
  changePasswordSchema,
  birthdaySchema,
  phoneSchemaFor,
  type EmailChangeInput,
  type ChangePasswordInput,
} from "@/lib/validations/profile";
import { parseBirthDate } from "@/lib/age";
import { normalizePhone } from "@/lib/phone";
import { CURRENCIES, MAX_CURRENCY_CHANGES } from "@/lib/constants";
import { createAndSendEmailChangeVerification } from "@/lib/email-change";
import { getOrigin } from "@/lib/origin";

export interface ActionResult {
  error?: string;
}

export async function updateNameAction(name: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = nameSchema.safeParse({ name });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form for errors" };

  await prisma.user.update({ where: { id: userId }, data: { name: parsed.data.name } });
  revalidatePath("/", "layout");
  return {};
}

export async function updateBirthdayAction(dateOfBirth: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = birthdaySchema.safeParse({ dateOfBirth });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Enter your date of birth" };

  await prisma.user.update({
    where: { id: userId },
    // Changing the date lets this year's wish go out again if the new date is today.
    data: { dateOfBirth: parseBirthDate(parsed.data.dateOfBirth), lastBirthdayWishYear: null },
  });
  revalidatePath("/", "layout");
  return {};
}

export async function updatePhoneAction(phone: string): Promise<ActionResult & { phone?: string }> {
  const userId = await requireUserId();
  const { currency } = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { currency: true } });
  const parsed = phoneSchemaFor(currency).safeParse({ phone });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Enter a valid phone number" };

  // Stored with its country code (from the primary currency now); a later currency change never rewrites it.
  const formatted = parsed.data.phone ? normalizePhone(parsed.data.phone, currency) || null : null;
  await prisma.user.update({ where: { id: userId }, data: { phone: formatted } });
  revalidatePath("/", "layout");
  return { phone: formatted ?? "" };
}

export async function updateAvatarPresetAction(avatar: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = avatarPresetSchema.safeParse({ avatar });
  if (!parsed.success) return { error: "Unknown avatar" };

  await prisma.user.update({ where: { id: userId }, data: { avatar: parsed.data.avatar } });
  revalidatePath("/", "layout");
  return {};
}

export async function updateNotificationPrefsAction(prefs: {
  notifyBills: boolean;
  notifyBudgets: boolean;
  notifyGoals: boolean;
  notifySubscriptions: boolean;
  notifyHolidays: boolean;
  notifyLoans: boolean;
}): Promise<ActionResult> {
  const userId = await requireUserId();
  await prisma.user.update({ where: { id: userId }, data: prefs });
  revalidatePath("/", "layout");
  return {};
}

/** Adds ids to the read set (merging with what is already stored, newest kept if it ever
 * grows past the cap) — merging matters now that the bell only lists unread items: a
 * wholesale replace would un-read everything that was not on screen at that moment. */
export async function markNotificationsReadAction(ids: string[]): Promise<ActionResult> {
  const userId = await requireUserId();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { readNotificationIds: true } });
  const merged = [...new Set([...user.readNotificationIds, ...ids])].slice(-300);
  await prisma.user.update({ where: { id: userId }, data: { readNotificationIds: merged } });
  revalidatePath("/", "layout");
  return {};
}

export async function updateCurrencyAction(currency: string): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!CURRENCIES.some((c) => c.code === currency)) return { error: "Unknown currency" };

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { currency: true, currencyChangeCount: true },
  });
  if (user.currency === currency) return {};
  if (user.currencyChangeCount >= MAX_CURRENCY_CHANGES) {
    return { error: `You've used all ${MAX_CURRENCY_CHANGES} currency changes` };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { currency, currencyChangeCount: { increment: 1 } },
  });

  // Currency drives which accounts count toward the dashboard's total balance.
  revalidatePath("/", "layout");
  return {};
}

export async function changePasswordAction(input: ChangePasswordInput): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form for errors" };

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { passwordHash: true } });
  const isCurrentPasswordValid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!isCurrentPasswordValid) return { error: "Current password is incorrect" };

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  return {};
}

export async function requestEmailChangeAction(input: EmailChangeInput): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = emailChangeSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Enter a valid email" };

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { email: true, name: true } });
  if (parsed.data.newEmail === user.email) return { error: "That's already your current email" };

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.newEmail } });
  if (existing) return { error: "An account with this email already exists" };

  try {
    await createAndSendEmailChangeVerification(userId, parsed.data.newEmail, user.name, await getOrigin());
  } catch (err) {
    console.error("[requestEmailChangeAction] failed to send:", err);
    return { error: "Couldn't send that verification email right now — try again shortly." };
  }

  revalidatePath("/profile");
  return {};
}

export async function cancelEmailChangeAction(): Promise<ActionResult> {
  const userId = await requireUserId();
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { pendingEmail: null } }),
    prisma.emailChangeToken.deleteMany({ where: { userId } }),
  ]);
  revalidatePath("/profile");
  return {};
}
