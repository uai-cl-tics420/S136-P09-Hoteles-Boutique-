"use server";

import { signOut } from "@/lib/auth/nextauth.config";

export async function logoutAction(locale: string = "es") {
  await signOut({ redirectTo: `/${locale}/auth/login` });
}
