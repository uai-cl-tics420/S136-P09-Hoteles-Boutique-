import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  generateTotpSecret,
  buildTotpUri,
  encryptOtpSecret,
} from "@/lib/auth/auth-service";
import { auth } from "@/lib/auth/nextauth.config";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const secret = generateTotpSecret();
    const uri = buildTotpUri(secret, session.user.email!);
    const encrypted = encryptOtpSecret(secret);

    // Guardar secret cifrado en DB (OTP aún no habilitado hasta verificar)
    await db
      .update(users)
      .set({ otpSecret: encrypted, otpEnabled: "false" })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({ uri, secret });
  } catch (error) {
    console.error("[otp/setup]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}