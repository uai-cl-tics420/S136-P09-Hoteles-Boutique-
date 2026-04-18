import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "./auth-service";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email as string),
        });

        if (!user || !user.passwordHash) return null;

        const valid = await verifyPassword(
          user.passwordHash,
          credentials.password as string
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          locale: user.locale,
          otpEnabled: user.otpEnabled,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      // Para SSO (Google), crear o actualizar usuario automáticamente
      if (account?.provider === "google") {
        const existing = await db.query.users.findFirst({
          where: eq(users.email, user.email!),
        });

        if (!existing) {
          await db.insert(users).values({
            email: user.email!,
            ssoProvider: "google",
            ssoSubject: account.providerAccountId,
            role: "GUEST",
            locale: "es",
          });
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        // Primera vez que se crea el token
        const dbUser = await db.query.users.findFirst({
          where: eq(users.email, user.email!),
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.locale = dbUser.locale;
          token.otpEnabled = dbUser.otpEnabled;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.locale = token.locale as string;
        session.user.otpEnabled = token.otpEnabled as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/es/auth/login",
    error: "/es/auth/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 días
  },
});