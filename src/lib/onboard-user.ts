import { prisma } from "@/lib/db";
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from "@/lib/constants";

/** Seeds the default categories (parents, then their children once the parents' ids
 * exist) + starting Cash account for a brand-new user, regardless of how they signed
 * up (credentials or OAuth). An interactive transaction (rather than a flat array of
 * statements) because the children's `parentId` isn't known until the parents have
 * actually been inserted and read back. */
export async function seedNewUserDefaults(userId: string, currency: string) {
  await prisma.$transaction(async (tx) => {
    await tx.category.createMany({
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
    });

    const parents = await tx.category.findMany({ where: { userId }, select: { id: true, name: true, type: true } });
    const parentId = (name: string, type: "EXPENSE" | "INCOME") => parents.find((p) => p.name === name && p.type === type)?.id;

    const children = [
      ...DEFAULT_EXPENSE_CATEGORIES.flatMap((c) =>
        (c.children ?? []).map((child, i) => ({
          name: child.name,
          icon: child.icon,
          color: child.color,
          type: "EXPENSE",
          userId,
          sortOrder: i,
          parentId: parentId(c.name, "EXPENSE"),
        })),
      ),
      ...DEFAULT_INCOME_CATEGORIES.flatMap((c) =>
        (c.children ?? []).map((child, i) => ({
          name: child.name,
          icon: child.icon,
          color: child.color,
          type: "INCOME",
          userId,
          sortOrder: i,
          parentId: parentId(c.name, "INCOME"),
        })),
      ),
    ];
    if (children.length > 0) await tx.category.createMany({ data: children });

    await tx.account.create({
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
    });
  });
}
