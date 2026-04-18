// src/lib/auth/nextauth.config.ts
import NextAuth, { DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { authConfig } from "./auth.config"; // <-- Importamos la config Edge
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

// Construir proveedores dinámicamente - Google solo si está configurado
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

      const valid = await verifyPassword(
        user.passwordHash,
        credentials.password as string
      );
      if (!valid) return null;

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

// Añadir Google solo si está configurado
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig, // Esparcimos la configuración básica
  providers,
  callbacks: {
    ...authConfig.callbacks, // Mantenemos el session()
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
    async jwt({ token, user }) {
      if (user && user.email) {
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
});

// Exportar authOptions para uso en getServerSession
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
      if (user && user.email) {
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