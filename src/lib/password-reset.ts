import { randomBytes } from "crypto";
import { addHours } from "date-fns";
import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";

const TOKEN_TTL_HOURS = 1;

export async function createAndSendPasswordResetEmail(userId: string, email: string, name: string, origin: string) {
  const token = randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: { userId, token, expiresAt: addHours(new Date(), TOKEN_TTL_HOURS) },
  });
  await sendPasswordResetEmail(email, name, `${origin}/reset-password?token=${token}`);
}
