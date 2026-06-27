import { db } from "./index";
import { hotels, hotelImages, roomTypes, extraServices } from "./schema";
import { sql } from "drizzle-orm";
import { config } from "dotenv";
config({ path: ".env" });

function slug(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"") + "-" + Math.random().toString(36).slice(2,7); }

const CITIES: { city: string; country: string; lat: number; lng: number }[] = [
  { city:"Santiago",      country:"Chile",     lat:-33.45, lng:-70.67 },
  { city:"Valparaíso",    country:"Chile",     lat:-33.04, lng:-71.62 },
  { city:"San Pedro de Atacama", country:"Chile", lat:-22.91, lng:-68.20 },
  { city:"Puerto Varas",  country:"Chile",     lat:-41.32, lng:-72.98 },
  { city:"Punta Arenas",  country:"Chile",     lat:-53.16, lng:-70.91 },
  { city:"Viña del Mar",  country:"Chile",     lat:-33.02, lng:-71.55 },
  { city:"Puerto Natales",country:"Chile",     lat:-51.73, lng:-72.50 },
  { city:"Pucón",         country:"Chile",     lat:-39.27, lng:-71.97 },
  { city:"Chiloé",        country:"Chile",     lat:-42.47, lng:-73.75 },
  { city:"Buenos Aires",  country:"Argentina", lat:-34.60, lng:-58.38 },
  { city:"Mendoza",       country:"Argentina", lat:-32.89, lng:-68.84 },
  { city:"Bariloche",     country:"Argentina", lat:-41.13, lng:-71.31 },
  { city:"Salta",         country:"Argentina", lat:-24.78, lng:-65.41 },
  { city:"Córdoba",       country:"Argentina", lat:-31.42, lng:-64.18 },
  { city:"Ushuaia",       country:"Argentina", lat:-54.80, lng:-68.30 },
  { city:"Cusco",         country:"Perú",      lat:-13.52, lng:-71.97 },
  { city:"Lima",          country:"Perú",      lat:-12.05, lng:-77.04 },
  { city:"Machu Picchu",  country:"Perú",      lat:-13.16, lng:-72.54 },
  { city:"Arequipa",      country:"Perú",      lat:-16.41, lng:-71.54 },
  { city:"Cartagena",     country:"Colombia",  lat:10.39,  lng:-75.48 },
  { city:"Bogotá",        country:"Colombia",  lat:4.71,   lng:-74.07 },
  { city:"Medellín",      country:"Colombia",  lat:6.25,   lng:-75.56 },
  { city:"Montevideo",    country:"Uruguay",   lat:-34.90, lng:-56.19 },
  { city:"Punta del Este",country:"Uruguay",   lat:-34.96, lng:-54.95 },
  { city:"Ciudad de México",country:"México",  lat:19.43,  lng:-99.13 },
  { city:"Oaxaca",        country:"México",    lat:17.06,  lng:-96.72 },
  { city:"Tulum",         country:"México",    lat:20.21,  lng:-87.46 },
  { city:"Mérida",        country:"México",    lat:20.97,  lng:-89.62 },
  { city:"São Paulo",     country:"Brasil",    lat:-23.55, lng:-46.63 },
  { city:"Rio de Janeiro",country:"Brasil",    lat:-22.91, lng:-43.17 },
  { city:"Florianópolis", country:"Brasil",    lat:-27.59, lng:-48.55 },
];

const PREFIXES = ["Hotel","Boutique Hotel","Casa","Hacienda","Lodge","Posada","Palacio","Villa","Estancia","Resort","Hostal","La","Las","Los","El"];
const ADJECTIVES = ["Azul","Bella","del Sol","del Valle","del Lago","de los Andes","Dorado","Real","Grand","Boutique","Natura","Selva","Puro","Sereno","Único","Exclusivo","Primavera","Jardin","Alto","Mágico","Austral","Pacifico","Andino","Colonial","Moderno","Secreto","Luxury","del Rio","del Mar"];
const CATEGORIES: ("LUXURY"|"BOUTIQUE"|"ECO"|"BEACH"|"MOUNTAIN"|"CITY")[] = ["LUXURY","BOUTIQUE","ECO","BEACH","MOUNTAIN","CITY"];

const UNSPLASH_HOTELS = [
  "photo-1566073771259-6a8506099945","photo-1582719508461-905c673771fd","photo-1542314831-068cd1dbfeeb",
  "photo-1520250497591-112f2f40a3f4","photo-1578683010236-d716f9a3f461","photo-1571896349842-33c89424de2d",
  "photo-1564501049412-61c2a3083791","photo-1551882547-ff40c63fe5fa","photo-1445019980597-93fa8acb246c",
  "photo-1496417263034-38ec4f0b665a","photo-1417325384643-04b6d75b8b41","photo-1455587734955-081b22074882",
  "photo-1602002418082-a4443978a5c1","photo-1544124499-58912cbddaad","photo-1484154218962-a197022b5858",
  "photo-1519449556851-5720b33024e7","photo-1548602088-9d12a4f9c10f","photo-1561501878-aabd62634533",
];

const EXTRA_SETS: Record<string, {name:string;category:string;price:string}[]> = {
  LUXURY:   [{name:"Spa & Masajes",category:"SPA",price:"85000"},{name:"Cena Gourmet",category:"DINING",price:"120000"},{name:"Transfer VIP",category:"TRANSPORT",price:"55000"},{name:"Tour Exclusivo",category:"EXPERIENCE",price:"95000"}],
  BOUTIQUE: [{name:"Desayuno Premium",category:"DINING",price:"25000"},{name:"Masaje Relajante",category:"SPA",price:"60000"},{name:"City Tour",category:"EXPERIENCE",price:"45000"}],
  ECO:      [{name:"Trekking Guiado",category:"EXPERIENCE",price:"40000"},{name:"Yoga",category:"SPA",price:"30000"},{name:"Traslado Eco",category:"TRANSPORT",price:"35000"}],
  BEACH:    [{name:"Kayak & Snorkel",category:"EXPERIENCE",price:"50000"},{name:"Cena en la Playa",category:"DINING",price:"90000"},{name:"Masaje Sunset",category:"SPA",price:"70000"}],
  MOUNTAIN: [{name:"Senderismo",category:"EXPERIENCE",price:"45000"},{name:"Fogón Gourmet",category:"DINING",price:"55000"},{name:"Transfer",category:"TRANSPORT",price:"40000"}],
  CITY:     [{name:"Transfer Aeropuerto",category:"TRANSPORT",price:"38000"},{name:"Cena Negocios",category:"DINING",price:"75000"},{name:"City Tour Premium",category:"EXPERIENCE",price:"50000"}],
};

const ROOM_SETS: {name:string;price:string;capacity:number;amenities:string[]}[][] = [
  [{name:"Habitación Estándar",price:"95000",capacity:2,amenities:["WiFi","TV","Baño privado"]},{name:"Suite Deluxe",price:"195000",capacity:2,amenities:["WiFi","TV","Minibar","Vista panorámica"]},{name:"Suite Master",price:"320000",capacity:4,amenities:["WiFi","TV","Jacuzzi","Sala de estar","Desayuno"]}],
  [{name:"Habitación Clásica",price:"80000",capacity:2,amenities:["WiFi","TV","A/C"]},{name:"Habitación Superior",price:"145000",capacity:3,amenities:["WiFi","TV","A/C","Terraza"]}],
  [{name:"Cabaña Estándar",price:"110000",capacity:2,amenities:["WiFi","Cocina","Chimenea"]},{name:"Cabaña Familiar",price:"220000",capacity:5,amenities:["WiFi","Cocina","Chimenea","2 baños"]}],
  [{name:"Room Boutique",price:"125000",capacity:2,amenities:["WiFi","Nespresso","Amenities premium"]},{name:"Junior Suite",price:"250000",capacity:2,amenities:["WiFi","Bañera","Vista al jardín","Minibar"]}],
];

const DESCRIPTIONS = [
  "Un refugio de lujo en el corazón de la ciudad, donde la elegancia y la comodidad se fusionan para crear una experiencia única e irrepetible.",
  "Rodeado de naturaleza exuberante, este hotel boutique ofrece una experiencia íntima y personalizada que dejará huella en tu memoria.",
  "Con vistas privilegiadas y servicio de clase mundial, cada detalle ha sido cuidadosamente diseñado para superar las expectativas más exigentes.",
  "Una joya arquitectónica que combina lo mejor de la tradición local con el confort moderno más sofisticado.",
  "Descubre un oasis de tranquilidad donde el tiempo se detiene y cada momento se convierte en un recuerdo imperecedero.",
  "Instalaciones de primera clase, gastronomía de autor y una ubicación inmejorable hacen de este lugar un destino en sí mismo.",
  "Una experiencia sensorial completa: arquitectura impresionante, gastronomía local de primera y atención personalizada las 24 horas.",
  "El equilibrio perfecto entre aventura y confort, pensado para los viajeros más exigentes que buscan autenticidad sin sacrificar el lujo.",
];

async function seed() {
  console.log("🌱 Starting large hotel seed...");

  const ownerRow = await db.execute(sql`SELECT id FROM users LIMIT 1`);
  if (!ownerRow.length) { console.error("No users found. Run db:seed first."); process.exit(1); }
  const ownerId = ownerRow[0].id as string;

  // Get existing slugs to avoid duplicates
  const existing = await db.execute(sql`SELECT slug FROM hotels`);
  const existingSlugs = new Set(existing.map((r:any) => r.slug));

  let inserted = 0;
  const target = 300;

  while (inserted < target) {
    const cityData = CITIES[Math.floor(Math.random() * CITIES.length)];
    const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const name = `${prefix} ${adj} ${cityData.city}`;
    const hotelSlug = slug(name);
    if (existingSlugs.has(hotelSlug)) continue;
    existingSlugs.add(hotelSlug);

    const stars = category === "LUXURY" ? 5 : category === "BOUTIQUE" ? Math.random() > 0.5 ? 4 : 3 : Math.random() > 0.4 ? 4 : 3;
    const photoRef = UNSPLASH_HOTELS[Math.floor(Math.random() * UNSPLASH_HOTELS.length)];
    const photoRef2 = UNSPLASH_HOTELS[Math.floor(Math.random() * UNSPLASH_HOTELS.length)];
    const desc = DESCRIPTIONS[Math.floor(Math.random() * DESCRIPTIONS.length)];

    const [h] = await db.insert(hotels).values({
      ownerId,
      name,
      slug: hotelSlug,
      description: desc,
      locationCity: cityData.city,
      locationCountry: cityData.country,
      address: `Calle Principal ${Math.floor(Math.random()*999)+1}, ${cityData.city}`,
      latitude: cityData.lat + (Math.random()-0.5)*0.1,
      longitude: cityData.lng + (Math.random()-0.5)*0.1,
      category,
      starRating: stars,
      active: true,
    }).returning({ id: hotels.id });

    const imgW = 800 + Math.floor(Math.random()*400);
    await db.insert(hotelImages).values([
      { hotelId: h.id, url: `https://images.unsplash.com/${photoRef}?w=${imgW}&q=80`, altText: name, isCover: true, sortOrder: 0 },
      { hotelId: h.id, url: `https://images.unsplash.com/${photoRef2}?w=600&q=75`, altText: name, isCover: false, sortOrder: 1 },
    ]);

    const roomSet = ROOM_SETS[Math.floor(Math.random() * ROOM_SETS.length)];
    for (const r of roomSet) {
      await db.insert(roomTypes).values({ hotelId: h.id, name: r.name, pricePerNight: r.price, capacity: r.capacity, currency: "CLP", totalRooms: Math.ceil(Math.random()*8)+2, amenities: r.amenities });
    }

    const extras = EXTRA_SETS[category] ?? EXTRA_SETS.BOUTIQUE;
    for (const e of extras) {
      await db.insert(extraServices).values({ hotelId: h.id, name: e.name, price: e.price, currency: "CLP", category: e.category as any, available: true });
    }

    inserted++;
    if (inserted % 20 === 0) console.log(`✅ ${inserted}/${target} hotels created...`);
  }

  console.log(`\n🎉 Done! Inserted ${inserted} new hotels.`);
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
