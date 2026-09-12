"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/db";
import { signIn } from "@/auth";
import { registerSchema, loginSchema, type RegisterInput, type LoginInput } from "@/lib/validations/auth";
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from "@/lib/constants";

export interface ActionResult {
  error?: string;
}

export async function registerAction(input: RegisterInput): Promise<ActionResult> {
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

  await prisma.$transaction([
    prisma.category.createMany({
      data: [
        ...DEFAULT_EXPENSE_CATEGORIES.map((c, i) => ({
          name: c.name,
          icon: c.icon,
          color: c.color,
          type: "EXPENSE",
          userId: user.id,
          sortOrder: i,
        })),
        ...DEFAULT_INCOME_CATEGORIES.map((c, i) => ({
          name: c.name,
          icon: c.icon,
          color: c.color,
          type: "INCOME",
          userId: user.id,
          sortOrder: i,
        })),
      ],
    }),
    prisma.account.create({
      data: {
        userId: user.id,
        name: "Cash",
        type: "CASH",
        currency: parsed.data.currency,
        startingBalance: 0,
        icon: "wallet",
        color: "emerald",
        sortOrder: 0,
      },
    }),
  ]);

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (err) {
    if (err instanceof AuthError) return { error: "Account created — please sign in" };
    throw err;
  }

  return {};
}

export async function loginAction(input: LoginInput): Promise<ActionResult> {
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
    if (err instanceof AuthError) {
      return { error: "Incorrect email or password" };
    }
    throw err;
  }
}
