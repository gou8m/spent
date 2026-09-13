import { randomBytes } from "crypto";
import { addHours } from "date-fns";
import { prisma } from "@/lib/db";
import { sendEmailChangeVerification } from "@/lib/email";

const TOKEN_TTL_HOURS = 24;

export async function createAndSendEmailChangeVerification(userId: string, newEmail: string, name: string, origin: string) {
  const token = randomBytes(32).toString("hex");
  await prisma.user.update({ where: { id: userId }, data: { pendingEmail: newEmail } });
  await prisma.emailChangeToken.deleteMany({ where: { userId } });
  await prisma.emailChangeToken.create({
    data: { userId, newEmail, token, expiresAt: addHours(new Date(), TOKEN_TTL_HOURS) },
  });
  await sendEmailChangeVerification(newEmail, name, `${origin}/verify-email-change?token=${token}`);
}
