import { prisma } from "@/lib/db";

export async function getCategories(userId: string, type?: "INCOME" | "EXPENSE", { includeArchived = false } = {}) {
  return prisma.category.findMany({
    where: {
      userId,
      ...(type ? { type } : {}),
      ...(includeArchived ? {} : { isArchived: false }),
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}
