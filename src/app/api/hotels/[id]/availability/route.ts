import { NextRequest, NextResponse } from "next/server";
import { getAvailability, setAvailability } from "@/services/availability.service";
import { auth } from "@/lib/auth/nextauth.config";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = request.nextUrl;
    const from = searchParams.get("from") ?? new Date().toISOString().split("T")[0];
    const to = searchParams.get("to") ?? new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
    const data = await getAvailability(id, from, to);
    return NextResponse.json({ availability: data });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "HOTEL_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await params;
    const body = await request.json();
    const record = await setAvailability(id, body.date, body.roomsAvailable, body.priceOverride);
    return NextResponse.json({ availability: record });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}