import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/places/photo?ref=PHOTO_REFERENCE&maxwidth=1200
 * Proxy server-side de fotos de Google Places.
 * La API key permanece en el servidor — nunca se expone al cliente.
 * Las imágenes se cachean 24h en el edge.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const ref = searchParams.get("ref");
  const maxwidth = searchParams.get("maxwidth") ?? "1200";

  if (!ref) {
    return NextResponse.json({ error: "ref requerido" }, { status: 400 });
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key no configurada" }, { status: 503 });
  }

  try {
    const googleUrl = `https://maps.googleapis.com/maps/api/place/photo?photoreference=${encodeURIComponent(ref)}&maxwidth=${maxwidth}&key=${apiKey}`;

    // Google responde con un redirect 302 a la CDN real — seguimos el redirect
    const res = await fetch(googleUrl, { redirect: "follow" });

    if (!res.ok) {
      return NextResponse.json({ error: "No se pudo obtener la foto" }, { status: 502 });
    }

    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Cache 24h en el cliente y 12h en el CDN edge
        "Cache-Control": "public, max-age=86400, s-maxage=43200, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("[GET /api/places/photo]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
