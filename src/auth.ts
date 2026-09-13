import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { CredentialsSignin } from "next-auth";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validations/auth";
import { seedNewUserDefaults } from "@/lib/onboard-user";

/** Thrown from `authorize` when the password is correct but the account's email hasn't been confirmed yet. */
export class EmailNotVerifiedError extends CredentialsSignin {
  code = "email-not-verified";
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
        if (!user) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        if (!user.emailVerified) throw new EmailNotVerifiedError();

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // First sign-in via Google: look up or create the local User row (no
      // adapter is configured — JWT sessions don't need one — so this app
      // owns account linking itself, keyed on email).
      if (account?.provider === "google" && profile?.email) {
        const email = (profile.email as string).toLowerCase();
        let dbUser = await prisma.user.findUnique({ where: { email } });

        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              email,
              name: (profile.name as string | undefined) || email.split("@")[0],
              // Google-authenticated users never use this hash to sign in via
              // credentials — it just satisfies the NOT NULL column.
              passwordHash: await bcrypt.hash(randomUUID(), 12),
              emailVerified: profile.email_verified ? new Date() : null,
            },
          });
          await seedNewUserDefaults(dbUser.id, dbUser.currency);
        } else if (!dbUser.emailVerified && profile.email_verified) {
          dbUser = await prisma.user.update({ where: { id: dbUser.id }, data: { emailVerified: new Date() } });
        }

        token.id = dbUser.id;
        return token;
      }

      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
