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

    // Si tiene OTP habilitado, no emitir JWT todavía — requerir verificación
    if (user.otpEnabled === "true") {
      const tempSessionId = await createSession(user.id, user.role);
      return NextResponse.json(
        { requiresOtp: true, tempSessionId },
        { status: 200 }
      );
    }

    // Sin OTP: emitir tokens directamente
    const sessionId = await createSession(user.id, user.role);
    const accessToken = await signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      locale: user.locale,
      sessionId,
    });

    const { raw: refreshToken, hashed } = generateRefreshToken();
    await redis.set(`refresh:${hashed}`, user.id, "EX", 7 * 24 * 60 * 60);

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, role: user.role },
    });

    response.cookies.set("bh_access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60,
      path: "/",
    });

    response.cookies.set("bh_refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("[login]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}