"use server";

import { signOut } from "@/lib/auth/nextauth.config";

export async function logoutAction() {
  await signOut({ redirectTo: "/es/auth/login" });
}
