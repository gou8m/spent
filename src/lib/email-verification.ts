import { randomBytes } from "crypto";
import { addHours } from "date-fns";
import { prisma } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";

const TOKEN_TTL_HOURS = 24;

export async function createAndSendVerificationEmail(userId: string, email: string, name: string, origin: string) {
  const token = randomBytes(32).toString("hex");
  await prisma.emailVerificationToken.create({
    data: { userId, token, expiresAt: addHours(new Date(), TOKEN_TTL_HOURS) },
  });
  await sendVerificationEmail(email, name, `${origin}/verify-email?token=${token}`);
}
