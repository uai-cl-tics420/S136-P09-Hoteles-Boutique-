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
import QRCode from "qrcode";

/**
 * POST /api/auth/otp/setup
 * Genera un secreto TOTP y retorna QR + secreto cifrado
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generar nuevo secreto TOTP (160-bit, RFC 4226 minimum)
    const secret = generateTotpSecret();
    
    // Construir URI para QR (RFC 6238 format)
    const uri = buildTotpUri(secret, session.user.email!);
    
    // Cifrar secret con AES-256-GCM antes de guardar en BD
    const encrypted = encryptOtpSecret(secret);

    // Generar código QR como Data URL
    const qrCode = await QRCode.toDataURL(uri, {
      errorCorrectionLevel: "H",
      width: 300,
    });

    // Guardar secret cifrado en DB (OTP aún no habilitado hasta verificar)
    await db
      .update(users)
      .set({ otpSecret: encrypted, otpEnabled: "false" })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({ 
      uri, 
      secret,
      qrCode,
      message: "Escanea con Google Authenticator, Authy o similar. Luego verifica el código.",
    });
  } catch (error) {
    console.error("[otp/setup]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}