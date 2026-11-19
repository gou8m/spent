import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendBirthdayEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * Runs once a day (see vercel.json) and emails a birthday wish to everyone whose birthday it is in India
 * (IST). Vercel calls it with `Authorization: Bearer $CRON_SECRET`; without that secret set, it refuses.
 * `lastBirthdayWishYear` keeps it to one email per person per year even if the job runs twice.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  const year = ist.getUTCFullYear();
  const month = ist.getUTCMonth() + 1;
  const day = ist.getUTCDate();
  const isLeap = new Date(Date.UTC(year, 1, 29)).getUTCMonth() === 1;

  // 29 February birthdays are wished on 28 February in years without one.
  const users = await prisma.$queryRaw<{ id: string; email: string; name: string }[]>`
    SELECT "id", "email", "name" FROM "User"
    WHERE "dateOfBirth" IS NOT NULL
      AND "emailVerified" IS NOT NULL
      AND ("lastBirthdayWishYear" IS NULL OR "lastBirthdayWishYear" < ${year})
      AND (
        (EXTRACT(MONTH FROM "dateOfBirth") = ${month} AND EXTRACT(DAY FROM "dateOfBirth") = ${day})
        OR (${!isLeap && month === 2 && day === 28} AND EXTRACT(MONTH FROM "dateOfBirth") = 2 AND EXTRACT(DAY FROM "dateOfBirth") = 29)
      )
  `;

  const origin = process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || "https://spentonline.in";
  let sent = 0;
  for (const user of users) {
    try {
      await sendBirthdayEmail(user.email, user.name, `${origin}/dashboard`);
      await prisma.user.update({ where: { id: user.id }, data: { lastBirthdayWishYear: year } });
      sent++;
    } catch (err) {
      console.error("[cron/birthdays] failed for", user.id, err);
    }
  }
  return NextResponse.json({ checked: users.length, sent });
}
