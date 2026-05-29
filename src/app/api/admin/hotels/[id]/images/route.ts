import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/nextauth.config";
import { db } from "@/db";
import { hotelImages } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const ADMIN_ROLES = ["HOTEL_ADMIN", "SUPER_ADMIN"];

/** GET /api/admin/hotels/[id]/images — lista imágenes del hotel */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session?.user || !ADMIN_ROLES.includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id: hotelId } = await params;
    const images = await db.query.hotelImages.findMany({
      where: eq(hotelImages.hotelId, hotelId),
      orderBy: (img, { asc }) => [asc(img.sortOrder)],
    });
    return NextResponse.json({ images });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** POST /api/admin/hotels/[id]/images — añade imagen por URL */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session?.user || !ADMIN_ROLES.includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id: hotelId } = await params;
    const body = await req.json();
    const { url, altText, isCover, sortOrder } = body;

    if (!url) return NextResponse.json({ error: "url es requerida" }, { status: 400 });

    // Si se marca como cover, desmarcar las demás
    if (isCover) {
      await db.update(hotelImages).set({ isCover: false }).where(eq(hotelImages.hotelId, hotelId));
    }

    const [image] = await db.insert(hotelImages).values({
      hotelId,
      url,
      altText: altText || null,
      isCover: isCover ?? false,
      sortOrder: sortOrder ?? 0,
    }).returning();

    return NextResponse.json({ image }, { status: 201 });
  } catch (e) {
    console.error("[POST /api/admin/hotels/[id]/images]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** DELETE /api/admin/hotels/[id]/images?imageId=... */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (!session?.user || !ADMIN_ROLES.includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id: hotelId } = await params;
    const imageId = req.nextUrl.searchParams.get("imageId");
    if (!imageId) return NextResponse.json({ error: "imageId requerido" }, { status: 400 });

    await db.delete(hotelImages).where(and(eq(hotelImages.id, imageId), eq(hotelImages.hotelId, hotelId)));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
