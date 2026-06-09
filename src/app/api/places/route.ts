import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { hotels, extraServices } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

/**
 * GET /api/admin/analytics/places?hotelId=xxx
 * Proxy server-side hacia Google Places API para obtener reseñas externas.
 * La API key permanece en el servidor — nunca se expone al cliente.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const hotelId = searchParams.get("hotelId");
    if (!hotelId) {
      return NextResponse.json({ error: "hotelId requerido" }, { status: 400 });
    }

    const [hotel] = await db
      .select({
        name: hotels.name,
        address: hotels.address,
        locationCity: hotels.locationCity,
        locationCountry: hotels.locationCountry,
        latitude: hotels.latitude,
        longitude: hotels.longitude,
      })
      .from(hotels)
      .where(eq(hotels.id, hotelId))
      .limit(1);

    if (!hotel) {
      return NextResponse.json({ error: "Hotel no encontrado" }, { status: 404 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    // Si no hay API key configurada, retornar datos del hotel sin Places data
    if (!apiKey) {
      return NextResponse.json({
        placesData: null,
        hotelName: hotel.name,
        searchQuery: `${hotel.name} ${hotel.locationCity}`,
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${hotel.name} ${hotel.address ?? ""} ${hotel.locationCity}`
        )}`,
      });
    }

    // 1. Find Place — busca el hotel en Google Places
    const findPlaceUrl = new URL(
      "https://maps.googleapis.com/maps/api/place/findplacefromtext/json"
    );
    findPlaceUrl.searchParams.set("input", `${hotel.name} ${hotel.address ?? ""} ${hotel.locationCity}`);
    findPlaceUrl.searchParams.set("inputtype", "textquery");
    findPlaceUrl.searchParams.set("fields", "place_id,name,rating,user_ratings_total,formatted_address");
    findPlaceUrl.searchParams.set("key", apiKey);

    const findRes = await fetch(findPlaceUrl.toString(), { next: { revalidate: 3600 } });
    const findData = await findRes.json();

    if (findData.status !== "OK" || !findData.candidates?.length) {
      return NextResponse.json({
        placesData: null,
        hotelName: hotel.name,
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${hotel.name} ${hotel.locationCity}`
        )}`,
      });
    }

    const placeId = findData.candidates[0].place_id;

    // 2. Place Details — obtiene reseñas y detalles completos
    const detailsUrl = new URL(
      "https://maps.googleapis.com/maps/api/place/details/json"
    );
    detailsUrl.searchParams.set("place_id", placeId);
    detailsUrl.searchParams.set(
      "fields",
      "name,rating,user_ratings_total,reviews,formatted_address,url,opening_hours"
    );
    detailsUrl.searchParams.set("language", "es");
    detailsUrl.searchParams.set("key", apiKey);

    const detailsRes = await fetch(detailsUrl.toString(), { next: { revalidate: 3600 } });
    const detailsData = await detailsRes.json();

    if (detailsData.status !== "OK") {
      return NextResponse.json({
        placesData: null,
        hotelName: hotel.name,
        placeId,
        mapsUrl: `https://www.google.com/maps/place/?q=place_id:${placeId}`,
      });
    }

    const result = detailsData.result;
    return NextResponse.json(
      {
        placesData: {
          placeId,
          name: result.name,
          rating: result.rating,
          totalRatings: result.user_ratings_total,
          address: result.formatted_address,
          mapsUrl: result.url,
          reviews: (result.reviews ?? []).slice(0, 5).map((r: any) => ({
            author: r.author_name,
            rating: r.rating,
            text: r.text,
            time: r.relative_time_description,
            profilePhoto: r.profile_photo_url,
          })),
        },
      },
      {
        headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" },
      }
    );
  } catch (error) {
    console.error("[GET /api/admin/analytics/places]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
