import { cache } from "react";
import { prisma } from "@/lib/db";

export const getTags = cache(async (userId: string) => {
  return prisma.tag.findMany({ where: { userId }, orderBy: { name: "asc" } });
});
