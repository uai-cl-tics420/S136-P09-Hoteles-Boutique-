import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/nextauth.config";
import { db } from "@/db";
import { guestPreferences } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/preferences
 * Retorna las preferencias del huésped autenticado.
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id as string;

    const pref = await db.query.guestPreferences.findFirst({
      where: eq(guestPreferences.guestId, userId),
    });

    return NextResponse.json({ preferences: pref ?? null });
  } catch (error) {
    console.error("[GET /api/preferences]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/preferences
 * Crea o actualiza las preferencias del huésped autenticado.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id as string;

    const body = await request.json();
    const { preferredCategories, preferredAmenities, preferredLocation, budgetMin, budgetMax } = body;

    const existing = await db.query.guestPreferences.findFirst({
      where: eq(guestPreferences.guestId, userId),
    });

    if (existing) {
      await db
        .update(guestPreferences)
        .set({
          preferredCategories: preferredCategories ?? existing.preferredCategories,
          preferredAmenities: preferredAmenities ?? existing.preferredAmenities,
          preferredLocation: preferredLocation ?? existing.preferredLocation,
          budgetMin: budgetMin ?? existing.budgetMin,
          budgetMax: budgetMax ?? existing.budgetMax,
          updatedAt: new Date(),
        })
        .where(eq(guestPreferences.guestId, userId));
    } else {
      await db.insert(guestPreferences).values({
        guestId: userId,
        preferredCategories: preferredCategories ?? [],
        preferredAmenities: preferredAmenities ?? [],
        preferredLocation: preferredLocation ?? null,
        budgetMin: budgetMin ?? null,
        budgetMax: budgetMax ?? null,
      });
    }

    const updated = await db.query.guestPreferences.findFirst({
      where: eq(guestPreferences.guestId, userId),
    });

    return NextResponse.json({ preferences: updated }, { status: 200 });
  } catch (error) {
    console.error("[POST /api/preferences]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
