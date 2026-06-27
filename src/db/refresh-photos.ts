/**
 * refresh-photos.ts
 * Para cada hotel en la BD, busca en Google Places por nombre+ciudad
 * y actualiza sus imágenes con photo_references frescas.
 * Corre TODOS los hoteles automáticamente en batches.
 *
 * Uso: bun src/db/refresh-photos.ts
 */

import { db } from "./index";
import { hotelImages } from "./schema";
import { sql } from "drizzle-orm";
import { config } from "dotenv";

config({ path: ".env" });

const API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

if (!API_KEY) {
  console.error("❌ No se encontró GOOGLE_MAPS_API_KEY en .env");
  process.exit(1);
}

const DELAY_MS         = 300;
const PHOTOS_PER_HOTEL = 3;
const BATCH_SIZE       = 80;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function findPlaceId(name: string, city: string, country: string): Promise<string | null> {
  const query = `${name} ${city} ${country}`;
  const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json` +
    `?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id&key=${API_KEY}`;
  try {
    const res  = await fetch(url);
    const data = await res.json() as any;
    return data.candidates?.[0]?.place_id ?? null;
  } catch { return null; }
}

async function getPhotos(placeId: string): Promise<{ photos: string[]; rating?: number }> {
  const url = `https://maps.googleapis.com/maps/api/place/details/json` +
    `?place_id=${placeId}&fields=photos,rating&key=${API_KEY}`;
  try {
    const res  = await fetch(url);
    const data = await res.json() as any;
    const photos = (data.result?.photos ?? [])
      .slice(0, PHOTOS_PER_HOTEL)
      .map((p: any) =>
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=${p.photo_reference}&key=${API_KEY}`
      );
    return { photos, rating: data.result?.rating };
  } catch { return { photos: [] }; }
}

async function main() {
  // Total de hoteles
  const [{ total }] = await db.execute(sql.raw(
    "SELECT COUNT(*) as total FROM hotels WHERE active = true"
  )) as any[];
  const totalHotels = Number(total);

  console.log(`🏨 ${totalHotels} hoteles a procesar en batches de ${BATCH_SIZE}\n`);

  let updated   = 0;
  let notFound  = 0;
  let noPhotos  = 0;
  let globalIdx = 0;

  for (let offset = 0; offset < totalHotels; offset += BATCH_SIZE) {
    const batch = await db.execute(sql.raw(
      `SELECT id, name, location_city, location_country
       FROM hotels WHERE active = true
       ORDER BY name
       LIMIT ${BATCH_SIZE} OFFSET ${offset}`
    )) as { id: string; name: string; location_city: string; location_country: string }[];

    console.log(`\n━━ Batch ${Math.floor(offset/BATCH_SIZE)+1} / ${Math.ceil(totalHotels/BATCH_SIZE)} (hoteles ${offset+1}–${Math.min(offset+BATCH_SIZE, totalHotels)}) ━━`);

    for (const hotel of batch) {
      globalIdx++;
      process.stdout.write(`[${globalIdx}/${totalHotels}] ${hotel.name.substring(0, 38).padEnd(38)} `);

      const placeId = await findPlaceId(hotel.name, hotel.location_city, hotel.location_country);
      await sleep(DELAY_MS);

      if (!placeId) {
        process.stdout.write(`→ ❌ No encontrado\n`);
        notFound++;
        continue;
      }

      const { photos, rating } = await getPhotos(placeId);
      await sleep(DELAY_MS);

      if (photos.length === 0) {
        process.stdout.write(`→ ⚠️  Sin fotos\n`);
        noPhotos++;
        continue;
      }

      // Actualizar BD
      await db.execute(sql.raw(`DELETE FROM hotel_images WHERE hotel_id = '${hotel.id}'`));
      for (let j = 0; j < photos.length; j++) {
        await db.insert(hotelImages).values({
          hotelId:   hotel.id,
          url:       photos[j],
          altText:   `Foto de ${hotel.name}`,
          isCover:   j === 0,
          sortOrder: j,
        });
      }

      process.stdout.write(`→ ✅ ${photos.length} fotos (★${rating ?? "?"})\n`);
      updated++;
    }

    // Pausa entre batches para no sobrecargar la API
    if (offset + BATCH_SIZE < totalHotels) {
      console.log(`   ⏸  Pausa 2s entre batches...`);
      await sleep(2000);
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Actualizados:   ${updated} hoteles`);
  console.log(`❌ No encontrados: ${notFound}`);
  console.log(`⚠️  Sin fotos:      ${noPhotos}`);
  console.log(`📸 Total fotos:    ~${updated * PHOTOS_PER_HOTEL}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  process.exit(0);
}

main().catch(e => { console.error("❌", e); process.exit(1); });
