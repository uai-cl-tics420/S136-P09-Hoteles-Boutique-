/**
 * scripts/enrich-from-places.ts  (v3 — Places API + Texto Alternativo)
 * ─────────────────────────────────────────────────────────────────────────────
 * Enriquece hoteles existentes con datos reales de Google Places API.
 * Usa Text Search y Find Place con múltiples estrategias de búsqueda.
 *
 * PREREQUISITO: Activar billing en Google Cloud Console (gratis con $300 crédito)
 * https://console.cloud.google.com/billing
 *
 * Uso:  bun scripts/enrich-from-places.ts
 *       bun scripts/enrich-from-places.ts --dry-run   (prueba sin modificar BD)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { config } from "dotenv";
config({ path: ".env" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { hotels, hotelImages } from "../src/db/schema";
import { eq } from "drizzle-orm";

const client = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(client);

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
const PHOTO_PROXY = "/api/places/photo";
const DELAY_MS = 500;
const MAX_PHOTOS = 6;
const DRY_RUN = process.argv.includes("--dry-run");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Mapeo: nombre ficticio → búsquedas reales en Google (múltiples fallbacks) ─
const HOTEL_SEARCHES: Record<string, string[]> = {
  "Casa Palacio San Cristóbal"   : ["Hotel Magnolia Santiago", "Castillo Rojo Santiago Chile"],
  "Refugio Bosque Maitén"        : ["Hotel Antumalal Pucon", "Antumalal Pucon Chile"],
  "Hotel Azul Paracas"           : ["Tierra Atacama Hotel & Spa", "tierra atacama san pedro"],
  "Puna Lodge Atacama"           : ["Tierra Atacama Hotel & Spa San Pedro", "Explora Atacama"],
  "Posada del Ángel Buenos Aires": ["Castillo Rojo Boutique Hotel Bellavista Santiago", "Hotel Magnolia Santiago Chile"],
  "Hacienda Montecillo"          : ["Hotel Bidasoa Providencia Santiago", "Bidasoa Hotel Santiago"],
  "Lomas de Uco Wine Lodge"      : ["Hotel Carmenere Santiago Chile", "Viña Santa Rita Hotel"],
  "Lastarria Boutique Hotel"     : ["Tinto Boutique Hotel Bellavista Santiago", "Hotel Magnolia Lastarria"],
  "Cerro Alegre House"           : ["Casa Higueras Valparaiso", "Hotel Gervasoni Valparaiso"],
  "Altiplanico Atacama"          : ["Altiplanico San Pedro de Atacama", "Hotel Altiplanico Atacama"],
  "Patagonia Wild Lodge"         : ["Hotel Pascual Andino San Pedro", "Awasi Patagonia Torres del Paine"],
  "Palafito 1326"                : ["Palafito 1326 Castro Chiloe", "Palacio Astoreca Valparaiso"],
  "Portillo Lodge Andino"        : ["Hotel Somerscales Valparaiso", "Hotel Portillo Chile Andes"],
  "Casa de Playa Reñaca"         : ["Zero Hotel Valparaiso Chile", "Casa Higueras Cerro Alegre"],
  "Villarrica Volcano Lodge"     : ["Hotel Antumalal Pucon Villarrica", "Villarrica Park Lake Hotel"],
  "El Mestizo Urban Boutique"    : ["Hotel Gervasoni Valparaiso Chile", "Tinto Hotel Santiago"],
  "Casa del Vino Maipo"          : ["Hotel Bidasoa Santiago", "Viña Concha y Toro Casa del Visitante"],
  "Casa Wayra Cusco"             : ["Casa Higueras Hotel Valparaiso", "Palacio Astoreca Hotel Valparaiso"],
};

// ─── Google Places API ────────────────────────────────────────────────────────

async function checkApiStatus(): Promise<{ ok: boolean; error?: string }> {
  const url = new URL("https://maps.googleapis.com/maps/api/place/findplacefromtext/json");
  url.searchParams.set("input", "test");
  url.searchParams.set("inputtype", "textquery");
  url.searchParams.set("fields", "place_id");
  url.searchParams.set("key", API_KEY);

  try {
    const res = await fetch(url.toString());
    const data = await res.json();
    if (data.status === "REQUEST_DENIED") {
      return { ok: false, error: data.error_message ?? "REQUEST_DENIED" };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

async function findPlace(query: string): Promise<string | null> {
  const url = new URL("https://maps.googleapis.com/maps/api/place/findplacefromtext/json");
  url.searchParams.set("input", query);
  url.searchParams.set("inputtype", "textquery");
  url.searchParams.set("fields", "place_id,name");
  url.searchParams.set("key", API_KEY);

  const res = await fetch(url.toString());
  const data = await res.json();

  if (data.status === "REQUEST_DENIED") throw new Error("BILLING_NOT_ENABLED");
  if (data.status !== "OK" || !data.candidates?.length) return null;
  return data.candidates[0].place_id as string;
}

interface PlaceDetails {
  placeId: string;
  name: string;
  rating: number | null;
  userRatingsTotal: number | null;
  formattedAddress: string | null;
  lat: number | null;
  lng: number | null;
  photoReferences: string[];
}

async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "place_id,name,rating,user_ratings_total,formatted_address,geometry,photos");
  url.searchParams.set("language", "es");
  url.searchParams.set("key", API_KEY);

  const res = await fetch(url.toString());
  const data = await res.json();

  if (data.status === "REQUEST_DENIED") throw new Error("BILLING_NOT_ENABLED");
  if (data.status !== "OK" || !data.result) return null;

  const r = data.result;
  return {
    placeId,
    name: r.name,
    rating: r.rating ?? null,
    userRatingsTotal: r.user_ratings_total ?? null,
    formattedAddress: r.formatted_address ?? null,
    lat: r.geometry?.location?.lat ?? null,
    lng: r.geometry?.location?.lng ?? null,
    photoReferences: (r.photos ?? [])
      .slice(0, MAX_PHOTOS)
      .map((p: any) => p.photo_reference as string)
      .filter(Boolean),
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log("  🗺️  Enriquecimiento con Google Places API");
  if (DRY_RUN) console.log("  🔍 MODO DRY-RUN — no se modificará la base de datos");
  console.log("═══════════════════════════════════════════════════\n");

  if (!API_KEY) {
    console.error("❌  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY no configurada en .env");
    process.exit(1);
  }

  // Verificar que la API está disponible antes de empezar
  console.log("🔌 Verificando acceso a Google Places API...");
  const apiStatus = await checkApiStatus();
  if (!apiStatus.ok) {
    console.error("\n❌ La API no está disponible:");
    console.error(`   ${apiStatus.error}\n`);
    console.error("📋 SOLUCIÓN:");
    console.error("   1. Ve a https://console.cloud.google.com/billing");
    console.error("   2. Activa el billing (gratis con $300 de crédito)");
    console.error("   3. Vuelve a ejecutar: bun scripts/enrich-from-places.ts\n");
    await client.end();
    process.exit(1);
  }
  console.log("✅ API disponible\n");

  const allHotels = await db.select().from(hotels);
  console.log(`📋 ${allHotels.length} hoteles en la base de datos\n`);

  let enriched = 0, skipped = 0, errors = 0;

  for (const hotel of allHotels) {
    const searchTerms = HOTEL_SEARCHES[hotel.name] ?? [`${hotel.name} ${hotel.locationCity} Chile`];
    process.stdout.write(`🏨 ${hotel.name}\n`);

    let placeId: string | null = null;
    let usedQuery = "";

    // Intentar cada término de búsqueda hasta encontrar resultado
    for (const term of searchTerms) {
      process.stdout.write(`   → "${term}"... `);
      try {
        await sleep(DELAY_MS);
        placeId = await findPlace(term);
        if (placeId) {
          usedQuery = term;
          console.log("encontrado ✓");
          break;
        } else {
          console.log("sin resultados");
        }
      } catch (err) {
        const msg = (err as Error).message;
        if (msg === "BILLING_NOT_ENABLED") {
          console.error("\n\n❌ BILLING NO ACTIVADO — deteniéndose");
          console.error("   Activa billing en: https://console.cloud.google.com/billing\n");
          await client.end();
          process.exit(1);
        }
        console.log(`error: ${msg}`);
      }
    }

    if (!placeId) {
      console.log("   ⚠️  No encontrado con ningún término de búsqueda\n");
      skipped++;
      continue;
    }

    try {
      await sleep(DELAY_MS);
      const details = await getPlaceDetails(placeId);

      if (!details) {
        console.log("   ⚠️  Sin detalles disponibles\n");
        skipped++;
        continue;
      }

      console.log(`   📊 Rating: ${details.rating ?? "N/A"} (${details.userRatingsTotal ?? 0} reseñas)`);
      console.log(`   📍 ${details.formattedAddress ?? "sin dirección"}`);
      console.log(`   📸 ${details.photoReferences.length} fotos de Google`);

      if (!DRY_RUN) {
        // Actualizar hotel
        await db.update(hotels).set({
          googlePlaceId: details.placeId,
          googleRating: details.rating ?? undefined,
          googleRatingCount: details.userRatingsTotal ?? undefined,
          ...(details.lat && details.lng ? { latitude: details.lat, longitude: details.lng } : {}),
          updatedAt: new Date(),
        }).where(eq(hotels.id, hotel.id));

        // Reemplazar imágenes con fotos reales de Google
        if (details.photoReferences.length > 0) {
          await db.delete(hotelImages).where(eq(hotelImages.hotelId, hotel.id));
          await db.insert(hotelImages).values(
            details.photoReferences.map((ref, i) => ({
              hotelId: hotel.id,
              url: `${PHOTO_PROXY}?ref=${encodeURIComponent(ref)}&maxwidth=1200`,
              altText: `${hotel.name} — foto de Google Maps`,
              isCover: i === 0,
              sortOrder: i,
            }))
          );
          console.log("   ✅ BD actualizada con fotos reales\n");
        } else {
          console.log("   ✅ Metadata actualizada (imágenes originales mantenidas)\n");
        }
      } else {
        console.log("   [DRY-RUN] Se actualizaría la BD\n");
      }

      enriched++;
    } catch (err) {
      console.log(`   ❌ Error: ${(err as Error).message}\n`);
      errors++;
    }
  }

  console.log("═══════════════════════════════════════════════════");
  console.log(`  ✅ Enriquecidos: ${enriched} / ${allHotels.length}`);
  console.log(`  ⚠️  Sin datos:   ${skipped}`);
  console.log(`  ❌ Errores:      ${errors}`);
  console.log("═══════════════════════════════════════════════════\n");

  if (!DRY_RUN && enriched > 0) {
    console.log("🎉 ¡Listo! Las fotos reales de Google Maps ya están en la BD.");
    console.log("   Las imágenes se sirven bajo /api/places/photo?ref=...\n");
  }

  await client.end();
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
