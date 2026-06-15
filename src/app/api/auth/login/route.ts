import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "@/lib/auth/auth-service";
import { createSession } from "@/lib/auth/session";
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

    // Si el usuario ya tiene OTP configurado → pedir código 2FA
    if (user.otpEnabled === "true") {
      const tempSessionId = await createSession(user.id, user.role);
      return NextResponse.json(
        { requiresOtp: true, tempSessionId },
        { status: 200 }
      );
    }

    // Sin OTP configurado → acceso directo (OTP es opcional, no obligatorio)
    return NextResponse.json({ requiresOtp: false }, { status: 200 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("[login]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
