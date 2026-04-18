import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { redis } from "@/lib/redis/client";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { signAccessToken, generateRefreshToken } from "@/lib/auth/auth-service";
import { createSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const rawToken = request.cookies.get("bh_refresh_token")?.value;
    if (!rawToken) return NextResponse.json({ error: "No refresh token" }, { status: 401 });

    const hashed = createHash("sha256").update(rawToken).digest("hex");
    const userId = await redis.get(`refresh:${hashed}`);
    if (!userId) return NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 });

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 401 });

    // Rotate refresh token
    await redis.del(`refresh:${hashed}`);
    const { raw: newRefresh, hashed: newHashed } = generateRefreshToken();
    await redis.set(`refresh:${newHashed}`, user.id, "EX", 7 * 24 * 60 * 60);

    const sessionId = await createSession(user.id, user.role);
    const accessToken = await signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      locale: user.locale,
      sessionId,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set("bh_access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60,
      path: "/",
    });
    response.cookies.set("bh_refresh_token", newRefresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("[refresh]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}