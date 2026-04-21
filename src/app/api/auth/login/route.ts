import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, signAccessToken, generateRefreshToken } from "@/lib/auth/auth-service";
import { createSession } from "@/lib/auth/session";
import { redis } from "@/lib/redis/client";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await verifyPassword(user.passwordHash, password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Crear sesión temporal siempre (OTP es obligatorio para todos)
    const tempSessionId = await createSession(user.id, user.role);

    // Si ya tiene OTP configurado → pedir código
    if (user.otpEnabled === "true") {
      return NextResponse.json(
        { requiresOtp: true, tempSessionId },
        { status: 200 }
      );
    }

    // Si NO tiene OTP configurado → forzar setup antes de continuar
    return NextResponse.json(
      { requiresOtpSetup: true, tempSessionId },
      { status: 200 }
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("[login]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
