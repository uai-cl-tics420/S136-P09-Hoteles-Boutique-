import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/nextauth.config";
import { db } from "@/db";
import { extraServices } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const patchSchema = z.object({
  available: z.boolean().optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; extraId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "HOTEL_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: hotelId, extraId } = await params;
    const body = await request.json();
    const data = patchSchema.parse(body);

    // Verify the extra belongs to this hotel
    const existing = await db.query.extraServices.findFirst({
      where: and(eq(extraServices.id, extraId), eq(extraServices.hotelId, hotelId)),
    });

    if (!existing) {
      return NextResponse.json({ error: "Extra service not found" }, { status: 404 });
    }

    const updateData: Record<string, any> = {};
    if (data.available !== undefined) updateData.available = data.available;
    if (data.name)        updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = data.price.toFixed(2);

    const [updated] = await db
      .update(extraServices)
      .set(updateData)
      .where(and(eq(extraServices.id, extraId), eq(extraServices.hotelId, hotelId)))
      .returning();

    return NextResponse.json({ extra: updated });
  } catch (error: any) {
    if (error?.errors) return NextResponse.json({ error: error.issues }, { status: 400 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; extraId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "HOTEL_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: hotelId, extraId } = await params;

    await db
      .delete(extraServices)
      .where(and(eq(extraServices.id, extraId), eq(extraServices.hotelId, hotelId)));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
