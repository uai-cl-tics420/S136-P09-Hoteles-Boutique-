// src/lib/auth/auth.config.ts
import type { NextAuthConfig } from "next-auth";


export const authConfig = {
  providers: [], // Lo dejamos vacío aquí
  pages: {
    signIn: "/es/auth/login",
    error: "/es/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 días
  },
  callbacks: {
    // En el Edge, solo necesitamos inyectar el token en la sesión
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.locale = token.locale as string;
        session.user.otpEnabled = token.otpEnabled as boolean;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;