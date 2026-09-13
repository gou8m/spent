import { prisma } from "@/lib/db";
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from "@/lib/constants";

/** Seeds the default categories + starting Cash account for a brand-new user, regardless of how they signed up (credentials or OAuth). */
export async function seedNewUserDefaults(userId: string, currency: string) {
  await prisma.$transaction([
    prisma.category.createMany({
      data: [
        ...DEFAULT_EXPENSE_CATEGORIES.map((c, i) => ({
          name: c.name,
          icon: c.icon,
          color: c.color,
          type: "EXPENSE",
          userId,
          sortOrder: i,
        })),
        ...DEFAULT_INCOME_CATEGORIES.map((c, i) => ({
          name: c.name,
          icon: c.icon,
          color: c.color,
          type: "INCOME",
          userId,
          sortOrder: i,
        })),
      ],
    }),
    prisma.account.create({
      data: {
        userId,
        name: "Cash",
        type: "CASH",
        currency,
        startingBalance: 0,
        icon: "wallet",
        color: "emerald",
        sortOrder: 0,
      },
    }),
  ]);
}
