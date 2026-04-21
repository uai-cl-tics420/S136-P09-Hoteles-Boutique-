// src/lib/auth/nextauth.config.ts
import NextAuth, { DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "./auth-service";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      locale: string;
      otpEnabled: boolean;
    } & DefaultSession["user"]
  }
}

const providers: any[] = [
  CredentialsProvider({
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

      const valid = await verifyPassword(user.passwordHash, credentials.password as string);
      if (!valid) return null;

      // FIX: Devolver todos los datos necesarios aquí para que jwt() los guarde
      // en el token y NO tenga que ir a la DB en cada request posterior.
      return {
        id: user.id.toString(),
        email: user.email,
        role: (user as any).role || "GUEST",
        locale: (user as any).locale || "es",
        otpEnabled: (user as any).otpEnabled || false,
      };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const existing = await db.query.users.findFirst({
          where: eq(users.email, user.email),
        });
        if (!existing) {
          await db.insert(users).values({
            email: user.email,
            ssoProvider: "google",
            ssoSubject: account.providerAccountId,
            role: "GUEST",
            locale: "es",
          });
        }
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      // FIX: Solo consultar la DB al hacer login (user existe) o al forzar update.
      // En requests normales, token ya tiene los datos — no tocar la DB.
      if (user) {
        // Login inicial: guardar todo en el token
        const dbUser = await db.query.users.findFirst({
          where: eq(users.email, user.email!),
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = (dbUser as any).role;
          token.locale = (dbUser as any).locale;
          token.otpEnabled = (dbUser as any).otpEnabled;
        }
      }
      // En requests subsiguientes: token ya tiene los datos, no hacer nada
      return token;
    },
  },
});

export const authOptions = {
  ...authConfig,
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }: any) {
      if (account?.provider === "google" && user.email) {
        const existing = await db.query.users.findFirst({
          where: eq(users.email, user.email),
        });
        if (!existing) {
          await db.insert(users).values({
            email: user.email,
            ssoProvider: "google",
            ssoSubject: account.providerAccountId,
            role: "GUEST",
            locale: "es",
          });
        }
      }
      return true;
    },
    async jwt({ token, user }: any) {
      if (user) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.email, user.email),
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = (dbUser as any).role;
          token.locale = (dbUser as any).locale;
          token.otpEnabled = (dbUser as any).otpEnabled;
        }
      }
      return token;
    },
  },
};
