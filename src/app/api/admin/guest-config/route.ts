import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/nextauth.config";
import { redis } from "@/lib/redis/client";

const ADMIN_ROLES = ["HOTEL_ADMIN", "SUPER_ADMIN"];

function guestConfigKey(hotelId: string) {
  return `guest_config:${hotelId}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session?.user || !ADMIN_ROLES.includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const hotelId = request.nextUrl.searchParams.get("hotelId");
    if (!hotelId) {
      return NextResponse.json({ error: "hotelId required" }, { status: 400 });
    }

    const data = await redis.get(guestConfigKey(hotelId));
    return NextResponse.json({ config: data ? JSON.parse(data) : null });
  } catch (error) {
    console.error("[GET /api/admin/guest-config]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session?.user || !ADMIN_ROLES.includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { hotelId, config } = body;

    if (!hotelId || !config) {
      return NextResponse.json({ error: "hotelId y config son requeridos" }, { status: 400 });
    }

    // Persist con TTL de 1 año
    await redis.set(guestConfigKey(hotelId), JSON.stringify(config), "EX", 365 * 24 * 3600);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/admin/guest-config]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
