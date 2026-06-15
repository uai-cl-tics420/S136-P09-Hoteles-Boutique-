import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis/client";

/**
 * GET /api/hotels/[id]/welcome
 * Endpoint PÚBLICO — devuelve solo el welcomeMessage del hotel para mostrárselo
 * al huésped en la página de detalle de reserva.
 * No expone datos sensibles de configuración admin.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hotelId } = await params;
    const raw = await redis.get(`guest_config:${hotelId}`);
    if (!raw) return NextResponse.json({ welcomeMessage: null });

    const config = JSON.parse(raw);
    // Solo devolvemos el welcomeMessage — sin exponer defaultPreferences u otros datos
    return NextResponse.json({
      welcomeMessage: config.welcomeMessage ?? null,
    });
  } catch {
    // Si Redis no está disponible, devolvemos null en lugar de 500
    return NextResponse.json({ welcomeMessage: null });
  }
}
