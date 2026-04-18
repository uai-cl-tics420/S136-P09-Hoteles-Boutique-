import { NextRequest, NextResponse } from "next/server";
import { decryptOtpSecret, generateTotpCode } from "@/lib/auth/auth-service";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  // ⚠️ SOLO para desarrollo/testing
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    const email = req.nextUrl.searchParams.get("email");
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Obtener usuario
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user || !user.otpSecret) {
      return NextResponse.json({ error: "User not found or no OTP secret" }, { status: 404 });
    }

    // Desencriptar el secret
    const plainSecret = decryptOtpSecret(user.otpSecret);

    // Generar código TOTP actual
    const totpCode = generateTotpCode(plainSecret);

    return NextResponse.json({
      email,
      totpCode,
      message: "⚠️ DEBUG ONLY - Este código es válido por 30 segundos",
    });
  } catch (error) {
    console.error("Debug code error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
