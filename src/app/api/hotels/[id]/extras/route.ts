import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/nextauth.config";
import { db } from "@/db";
import { extraServices } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const extraSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().min(0),
  category: z.enum(["SPA", "DINING", "TRANSPORT", "EXPERIENCE", "OTHER"]),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const extras = await db.select().from(extraServices).where(eq(extraServices.hotelId, id));
    return NextResponse.json({ extras });
  } catch {
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
    const data = extraSchema.parse(body);
    const [extra] = await db
      .insert(extraServices)
      .values({
        hotelId: id,
        name: data.name,
        description: data.description ?? null,
        price: data.price.toFixed(2),
        currency: "USD",
        category: data.category,
        available: true,
      })
      .returning();
    return NextResponse.json({ extra }, { status: 201 });
  } catch (error: any) {
    if (error?.errors) return NextResponse.json({ error: error.issues }, { status: 400 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}