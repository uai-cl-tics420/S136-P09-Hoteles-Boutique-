import { db } from "@/db";
import { hotels, hotelImages, reviews } from "@/db/schema";
import { sql, eq, and, ne, inArray, asc } from "drizzle-orm";
import HotelImg from "./HotelImg";
import Link from "next/link";

interface Props {
  hotelId: string;
  category: string;
  locale: string;
  locationCity: string;
}

export default async function SimilarHotels({ hotelId, category, locale, locationCity }: Props) {
  // Hotels in same city first, then same category, exclude current
  const cityHotels = await db
    .select({ id: hotels.id, name: hotels.name, slug: hotels.slug, category: hotels.category,
              starRating: hotels.starRating, locationCity: hotels.locationCity, locationCountry: hotels.locationCountry })
    .from(hotels)
    .where(and(eq(hotels.active, true), eq(hotels.locationCity, locationCity), ne(hotels.id, hotelId)))
    .orderBy(asc(sql`RANDOM()`))
    .limit(3);

  const catHotels = await db
    .select({ id: hotels.id, name: hotels.name, slug: hotels.slug, category: hotels.category,
              starRating: hotels.starRating, locationCity: hotels.locationCity, locationCountry: hotels.locationCountry })
    .from(hotels)
    .where(and(eq(hotels.active, true), eq(hotels.category, category as any), ne(hotels.id, hotelId)))
    .orderBy(asc(sql`RANDOM()`))
    .limit(6);

  // Merge: city first, then category, deduplicate, take 3
  const seen = new Set<string>([hotelId]);
  const merged: typeof cityHotels = [];
  for (const h of [...cityHotels, ...catHotels]) {
    if (!seen.has(h.id) && merged.length < 3) { seen.add(h.id); merged.push(h); }
  }
  if (merged.length === 0) return null;

  const ids = merged.map(h => h.id);
  const [imageRows, ratingRows] = await Promise.all([
    db.select({ hotelId: hotelImages.hotelId, url: hotelImages.url })
      .from(hotelImages).where(and(inArray(hotelImages.hotelId, ids), eq(hotelImages.isCover, true))),
    db.select({ hotelId: reviews.hotelId, avg: sql<string>`ROUND(AVG(${reviews.ratingOverall})::numeric,1)` })
      .from(reviews).where(inArray(reviews.hotelId, ids)).groupBy(reviews.hotelId),
  ]);

  const imgByHotel  = Object.fromEntries(imageRows.map(r => [r.hotelId, r.url]));
  const ratingByHotel = Object.fromEntries(ratingRows.map(r => [r.hotelId, r.avg]));

  const catColors: Record<string, string> = {
    LUXURY: "bg-purple-100 text-purple-700", BOUTIQUE: "bg-rose-100 text-rose-700",
    ECO: "bg-emerald-100 text-emerald-700",  BEACH: "bg-sky-100 text-sky-700",
    MOUNTAIN: "bg-amber-100 text-amber-700", CITY: "bg-zinc-100 text-zinc-600",
  };
  const catLabels: Record<string, string> = {
    LUXURY: "Lujo", BOUTIQUE: "Boutique", ECO: "Eco",
    BEACH: "Playa", MOUNTAIN: "Montaña", CITY: "Ciudad",
  };

  return (
    <section className="animate-slide-up">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">
          Hoteles similares
        </h2>
        <Link href={`/${locale}/hotels?category=${category}`}
          className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--gold-dark)] flex items-center gap-1 transition-colors">
          Ver todos →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {merged.map(hotel => {
          const imgUrl = imgByHotel[hotel.id];
          const rating = ratingByHotel[hotel.id];
          return (
            <Link key={hotel.id} href={`/${locale}/hotels/${hotel.slug}`}
              className="group rounded-2xl overflow-hidden border border-[var(--border)] bg-white hover:shadow-[var(--shadow-lg)] hover:-translate-y-1.5 transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
              {/* Image */}
              <div className="h-36 relative overflow-hidden bg-[var(--surface-2)]">
                {imgUrl ? (
                  <HotelImg src={imgUrl} alt={hotel.name} fallbackSeed={hotel.id}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl opacity-10">🏨</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                {rating && (
                  <div className="absolute bottom-2.5 right-2.5 glass-dark text-white text-[10px] font-black px-2 py-1 rounded-full flex items-center gap-1">
                    <span className="text-[var(--gold-shine)]">★</span> {rating}
                  </div>
                )}
              </div>
              {/* Body */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="text-[13px] font-bold text-[var(--text-primary)] group-hover:text-[var(--gold-dark)] transition-colors line-clamp-1 flex-1">{hotel.name}</p>
                  <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0 ${catColors[hotel.category] ?? "bg-gray-100 text-gray-700"}`}>
                    {catLabels[hotel.category] ?? hotel.category}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] font-medium flex items-center gap-1">
                  <span>📍</span> {hotel.locationCity}
                </p>
                <div className="flex items-center gap-0.5 mt-2">
                  {Array.from({ length: hotel.starRating }).map((_, i) => (
                    <span key={i} className="text-[var(--gold)] text-[10px]">★</span>
                  ))}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
