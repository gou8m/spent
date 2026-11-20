import { headers } from "next/headers";
import { prisma } from "@/lib/db";

/**
 * A small fixed-window rate limiter kept in the database, so it holds across every serverless instance
 * (an in-memory counter would reset on each cold start). Used on sign-in, sign-up, password reset, the
 * verification email and the account-security forms, to stop password guessing and email flooding.
 */

export const TOO_MANY_ATTEMPTS = "Too many attempts. Try again in a few minutes.";

/**
 * Counts one hit for `key` and says whether it is still within `limit` hits per `windowSeconds`.
 * The count and the window reset happen in one atomic statement, so concurrent requests cannot slip past.
 * If the counter itself fails (database hiccup) it fails open rather than locking everyone out.
 */
export async function withinRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  try {
    const rows = await prisma.$queryRaw<{ count: number }[]>`
      INSERT INTO "RateLimit" ("key", "count", "windowStart")
      VALUES (${key}, 1, now())
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "RateLimit"."windowStart" < now() - make_interval(secs => ${windowSeconds}) THEN 1 ELSE "RateLimit"."count" + 1 END,
        "windowStart" = CASE WHEN "RateLimit"."windowStart" < now() - make_interval(secs => ${windowSeconds}) THEN now() ELSE "RateLimit"."windowStart" END
      RETURNING "count"
    `;
    return (rows[0]?.count ?? 1) <= limit;
  } catch (error) {
    console.error("[rate-limit] counter failed, allowing the request:", error);
    return true;
  }
}

/** The caller's address as the hosting proxy reports it ("unknown" when absent). */
export function ipFromHeaders(h: { get(name: string): string | null }): string {
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip") || "unknown";
}

export async function clientIp(): Promise<string> {
  return ipFromHeaders(await headers());
}
