import { db } from "./index";
import { hotels, hotelImages, roomTypes } from "./schema";
import { eq, sql } from "drizzle-orm";
import { config } from "dotenv";

config({ path: ".env" });

const API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

if (!API_KEY) {
  console.error("No Google Maps API Key found in .env");
  process.exit(1);
}

const QUERIES = [
  "Boutique hotels in Santiago Chile",
  "Luxury hotels in Santiago Chile",
  "Eco lodge Patagonia Chile",
  "Eco lodge Puerto Varas Chile",
  "Boutique hotels Valparaiso Chile",
  "Luxury hotels Vina del Mar Chile",
  "Boutique hotels San Pedro de Atacama",
  "Hotels in Chiloe Chile",
  "Boutique hotels Cusco Peru",
  "Luxury hotels Buenos Aires Argentina"
];

const CATEGORIES = ["BOUTIQUE", "ECO", "LUXURY", "CITY", "MOUNTAIN", "BEACH"];

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

async function fetchPlaces(query: string) {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results || [];
}

async function seed() {
  console.log("Seeding with real hotels from Google Places...");
  
  // Clean up existing hotels
  console.log("Clearing existing hotels...");
  await db.execute(sql`TRUNCATE TABLE hotels CASCADE;`);

  let totalInserted = 0;
  const processedPlaces = new Set<string>();

  // Get or create an owner user
  let ownerId: string;
  const existingUsers = await db.execute(sql`SELECT id FROM users LIMIT 1;`);
  if (existingUsers.length > 0) {
    ownerId = existingUsers[0].id as string;
  } else {
    const insertedUser = await db.execute(sql`INSERT INTO users (id, email, role) VALUES (gen_random_uuid(), 'admin@googleplaces.com', 'SUPER_ADMIN') RETURNING id;`);
    ownerId = insertedUser[0].id as string;
  }

  for (const query of QUERIES) {
    console.log(`Fetching places for query: "${query}"`);
    const places = await fetchPlaces(query);
    
    // Process top 15 from each query
    for (const place of places.slice(0, 15)) {
      if (!place.place_id) continue;
      if (processedPlaces.has(place.place_id)) {
        console.log(`Skipping duplicate: ${place.name}`);
        continue;
      }
      processedPlaces.add(place.place_id);
      
      const category = query.includes("Eco") ? "ECO" : query.includes("Luxury") ? "LUXURY" : "BOUTIQUE";
      const slug = slugify(place.name + "-" + place.place_id.substring(0, 5));
      
      console.log(`Inserting hotel: ${place.name}`);
      
      const insertedHotels = await db.insert(hotels).values({
        ownerId: ownerId,
        name: place.name,
        slug: slug,
        description: `Un hermoso hotel ubicado en ${place.formatted_address}. Descubre la magia de este lugar con excelentes calificaciones y un servicio de primera. Basado en datos reales de Google Places.`,
        locationCity: place.formatted_address.split(',').length > 1 ? place.formatted_address.split(',')[1].trim() : "Chile",
        locationCountry: "Chile",
        address: place.formatted_address,
        latitude: place.geometry?.location?.lat || 0,
        longitude: place.geometry?.location?.lng || 0,
        category: category as any,
        starRating: Math.round(place.rating || 4),
      }).returning({ id: hotels.id });

      const hotelId = insertedHotels[0].id;
      
      // Images
      if (place.photos && place.photos.length > 0) {
        for (let i = 0; i < Math.min(place.photos.length, 3); i++) {
          const photo = place.photos[i];
          const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${API_KEY}`;
          await db.insert(hotelImages).values({
            hotelId,
            url: photoUrl,
            altText: `Foto de ${place.name}`,
            isCover: i === 0,
            sortOrder: i
          });
        }
      } else {
        // Fallback image
        await db.insert(hotelImages).values({
          hotelId,
          url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80",
          altText: "Imagen por defecto",
          isCover: true,
          sortOrder: 0
        });
      }

      // Dummy Room Types
      await db.insert(roomTypes).values([
        {
          hotelId,
          name: "Habitación Estándar",
          description: "Confortable habitación con todas las comodidades modernas.",
          capacity: 2,
          pricePerNight: "120000",
          currency: "CLP",
          totalRooms: 5,
          amenities: ["WiFi", "TV", "Aire acondicionado"]
        },
        {
          hotelId,
          name: "Suite Premium",
          description: "Suite espaciosa con vistas privilegiadas.",
          capacity: 2,
          pricePerNight: "250000",
          currency: "CLP",
          totalRooms: 2,
          amenities: ["WiFi", "TV", "Minibar", "Desayuno incluido"]
        }
      ]);
      
      totalInserted++;
    }
  }

  console.log(`✅ Completado. Se insertaron ${totalInserted} hoteles reales desde Google Places.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Error seeding Google Places:", err);
  process.exit(1);
});
