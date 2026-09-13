import { cache } from "react";
import { prisma } from "@/lib/db";

/**
 * React's `cache()` de-dupes calls with the same argument within a single
 * request/render pass — since the root layout (AppShell) and the page it
 * wraps each independently need the current user, without this they'd fire
 * two separate round-trips to the same row on every single page load. That
 * doubling matters a lot here specifically: the DB is in a different region
 * from where this typically runs, so every extra round-trip is a real,
 * user-visible delay, not just a wasted query.
 */
export const getCurrentUser = cache(async (userId: string) => {
  return prisma.user.findUniqueOrThrow({ where: { id: userId } });
});
