import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  verifyTotp,
  decryptOtpSecret,
  signAccessToken,
  generateRefreshToken,
} from "@/lib/auth/auth-service";
import { getSession, markOtpVerified } from "@/lib/auth/session";
import { redis } from "@/lib/redis/client";
import { z } from "zod";

const verifySchema = z.object({
  token: z.string().length(6),
  tempSessionId: z.string().optional(), // para login con OTP
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, tempSessionId } = verifySchema.parse(body);

    let userId: string;

    if (tempSessionId) {
      // Flujo: login → OTP verify
      const session = await getSession(tempSessionId);
      if (!session) {
        return NextResponse.json({ error: "Session expired" }, { status: 401 });
      }
      userId = session.userId;
    } else {
      // Flujo: setup OTP (usuario ya autenticado quiere activar OTP)
      const cookieToken = request.cookies.get("bh_access_token")?.value;
      if (!cookieToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      // Extraer userId del token (simplificado — en prod usar jwtVerify de jose)
      const payload = JSON.parse(
        Buffer.from(cookieToken.split(".")[1], "base64url").toString()
      );
      userId = payload.sub;
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user?.otpSecret) {
      return NextResponse.json({ error: "OTP not configured" }, { status: 400 });
    }

    const secret = decryptOtpSecret(user.otpSecret);
    const valid = verifyTotp(token, secret);

    if (!valid) {
      return NextResponse.json({ error: "Invalid OTP token" }, { status: 401 });
    }

    // Activar OTP si era setup
    if (!tempSessionId) {
      await db
        .update(users)
        .set({ otpEnabled: "true" })
        .where(eq(users.id, userId));
      return NextResponse.json({ message: "OTP enabled successfully" });
    }

    // Emitir JWT después de verificar OTP en login
    await markOtpVerified(tempSessionId);

    const accessToken = await signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      locale: user.locale,
      sessionId: tempSessionId,
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
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error("[otp/verify]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}