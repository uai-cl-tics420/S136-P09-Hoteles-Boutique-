import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  generateTotpSecret,
  buildTotpUri,
  encryptOtpSecret,
} from "@/lib/auth/auth-service";
import QRCode from "qrcode";
import { z } from "zod";

const setupSchema = z.object({
  email: z.string().email(),
});

/**
 * POST /api/auth/otp/setup
 * Genera un secreto TOTP y retorna QR + secreto cifrado
 */
export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: "Invalid or missing request body" }, { status: 400 });
    }
    
    const { email } = setupSchema.parse(body);

    // Obtener usuario de la BD
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generar nuevo secreto TOTP (160-bit, RFC 4226 minimum)
    const secret = generateTotpSecret();
    
    // Construir URI para QR (RFC 6238 format)
    const uri = buildTotpUri(secret, email);
    
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
      .where(eq(users.id, user.id));

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