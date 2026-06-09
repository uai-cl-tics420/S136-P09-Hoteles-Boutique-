import { notFound } from "next/navigation";
import { getHotelBySlug } from "@/services/hotel.service";
import { getReviewsByHotel } from "@/services/review.service";
import { auth } from "@/lib/auth/nextauth.config";
import BookingWidget from "@/components/BookingWidget";
import HotelReviews from "@/components/HotelReviews";
import FavButton from "@/components/FavButton";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const CAT_LABELS: Record<string, string> = {
  LUXURY: "Lujo", BOUTIQUE: "Boutique", ECO: "Eco",
  BEACH: "Playa", MOUNTAIN: "Montaña", CITY: "Ciudad",
};

const CAT_BADGE: Record<string, string> = {
  LUXURY:   "bg-purple-50 text-purple-700 border-purple-200",
  BOUTIQUE: "bg-rose-50 text-rose-700 border-rose-200",
  ECO:      "bg-emerald-50 text-emerald-700 border-emerald-200",
  BEACH:    "bg-sky-50 text-sky-700 border-sky-200",
  MOUNTAIN: "bg-amber-50 text-amber-700 border-amber-200",
  CITY:     "bg-gray-100 text-gray-600 border-gray-200",
};

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export default async function HotelDetailPage({ params }: PageProps) {
  const { slug, locale } = await params;

  // Primero obtenemos el hotel para tener su ID
  const hotel = await getHotelBySlug(slug);
  if (!hotel) notFound();

  // Luego en paralelo: reviews (primeras 5) y sesión
  const PAGE_SIZE = 5;
  const [allReviews, session] = await Promise.all([
    getReviewsByHotel(hotel.id),
    auth(),
  ]);
  const initialReviews = allReviews.slice(0, PAGE_SIZE);
  const initialTotal   = allReviews.length;
  const initialHasMore = initialTotal > PAGE_SIZE;

  const isLoggedIn = !!session?.user;
  const userId = (session?.user as any)?.id ?? null;

  // Check if logged-in user has a completed booking here (to show review form)
  let canReview = false;
  let reviewableBookingId: string | null = null;
  if (userId) {
    const hotelRoomIds = (hotel.roomTypes ?? []).map((r: any) => r.id);
    if (hotelRoomIds.length > 0) {
      const completedBooking = await db.query.bookings.findFirst({
        where: (b, { and, eq, inArray }) =>
          and(
            eq(b.guestId, userId),
            eq(b.status, "COMPLETED"),
            inArray(b.roomTypeId, hotelRoomIds)
          ),
      });
      canReview = !!completedBooking;
      reviewableBookingId = completedBooking?.id ?? null;
    }
  }

  const avgRating = allReviews.length
    ? (allReviews.reduce((a, r) => a + r.ratingOverall, 0) / allReviews.length).toFixed(1)
    : null;

  const badge = CAT_BADGE[hotel.category] ?? "bg-gray-100 text-gray-600 border-gray-200";
  const mainImage  = hotel.images?.[0];
  const thumbs     = hotel.images?.slice(1) ?? [];


  return (
    <div className="min-h-screen bg-[var(--background)]">

      {/* ── Navbar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 glass border-b border-[var(--border-soft)] shadow-[var(--shadow-xs)]">
        <div className="max-w-7xl mx-auto px-5 h-14 flex items-center gap-3">
          <a
            href={`/${locale}/hotels`}
            className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            Hoteles
          </a>
          <span className="text-[var(--border)] select-none">/</span>
          <span className="text-sm font-semibold text-[var(--text-primary)] truncate max-w-[280px]">
            {hotel.name}
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 py-8">

        {/* ── Cabecera ──────────────────────────────────────── */}
        <div className="mb-8 animate-slide-up">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${badge}`}>
              {CAT_LABELS[hotel.category] ?? hotel.category}
            </span>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: hotel.starRating }).map((_, i) => (
                <span key={i} className="text-[var(--gold)] text-sm">★</span>
              ))}
            </div>
            {avgRating && (
              <span className="text-sm font-bold text-[var(--text-primary)] bg-[var(--gold-light)] px-2.5 py-0.5 rounded-full text-[var(--gold-dark)]">
                ★ {avgRating} · {initialTotal} reseñas
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-[var(--text-primary)] tracking-tight mb-3 leading-tight">
            {hotel.name}
          </h1>
          <div className="flex items-center gap-3">
            <p className="flex items-center gap-1.5 text-[var(--text-muted)] text-sm font-medium">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {hotel.locationCity}, {hotel.locationCountry}
              {hotel.address && <><span className="mx-1 text-[var(--border)]">·</span><span className="text-[var(--text-muted)]/70">{hotel.address}</span></>}
            </p>
            <FavButton hotelId={hotel.id} hotelSlug={hotel.slug} hotelName={hotel.name} />
          </div>
        </div>

        {/* ── Galería ────────────────────────────────────────── */}
        <div className="mb-10 animate-scale-in">
          {mainImage ? (
            <div className="grid grid-cols-4 grid-rows-2 gap-2 rounded-2xl overflow-hidden h-[440px]">
              {/* Imagen principal */}
              <div className="col-span-2 row-span-2 relative overflow-hidden group">
                <img
                  src={mainImage.url}
                  alt={hotel.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="eager"
                />
              </div>
              {/* Thumbnails (hasta 4) */}
              {thumbs.slice(0, 4).map((img: any, i: number) => (
                <div key={img.id} className="relative overflow-hidden group">
                  <img
                    src={img.url}
                    alt={`${hotel.name} — foto ${i + 2}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  {/* Badge "ver más" en el último thumb si hay más imágenes */}
                  {i === 3 && thumbs.length > 4 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">+{thumbs.length - 4} fotos</span>
                    </div>
                  )}
                </div>
              ))}
              {/* Rellenar celdas vacías */}
              {Array.from({ length: Math.max(0, 4 - thumbs.length) }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-[var(--surface-2)]" />
              ))}
            </div>
          ) : (
            <div className="h-72 bg-[var(--surface-2)] rounded-2xl flex items-center justify-center text-5xl opacity-20">🏨</div>
          )}
        </div>

        {/* ── Layout principal ───────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">

          {/* Columna izquierda */}
          <div className="space-y-10">

            {/* Descripción */}
            {hotel.description && (
              <section className="animate-slide-up">
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Sobre este hotel</h2>
                <p className="text-[var(--text-secondary)] leading-relaxed font-light">
                  {hotel.description.replace(/\[GUEST_CONFIG\][\s\S]*?\[\/GUEST_CONFIG\]/g, "").trim()}
                </p>
              </section>
            )}

            {/* Habitaciones */}
            {hotel.roomTypes?.length > 0 && (
              <section className="animate-slide-up">
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-5">Habitaciones</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hotel.roomTypes.map((rt: any) => (
                    <RoomCard key={rt.id} rt={rt} />
                  ))}
                </div>
              </section>
            )}

            {/* Divider */}
            <div className="border-t border-[var(--border)]" />

            {/* Ubicación */}
            {hotel.address && (
              <section className="animate-slide-up">
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Ubicación</h2>
                <div className="bg-white border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4 shadow-[var(--shadow-xs)] mb-4">
                  <div className="w-11 h-11 bg-[var(--gold-light)] rounded-xl flex items-center justify-center text-lg shrink-0">📍</div>
                  <div className="flex-1">
                    <p className="font-semibold text-[var(--text-primary)] text-sm">{hotel.address}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{hotel.locationCity}, {hotel.locationCountry}</p>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${hotel.name} ${hotel.address} ${hotel.locationCity}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-[var(--gold-dark)] hover:text-[var(--gold)] transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                      <polyline points="15 3 21 3 21 9"/>
                      <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                    Ver en Maps
                  </a>
                </div>

                {/* Google Maps iframe embed */}
                <div className="rounded-2xl overflow-hidden border border-[var(--border)] shadow-[var(--shadow-xs)] h-64">
                  <iframe
                    title={`Mapa de ${hotel.name}`}
                    width="100%"
                    height="100%"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(`${hotel.name} ${hotel.address} ${hotel.locationCity}`)}&output=embed`}
                    className="w-full h-full border-0"
                  />
                </div>
              </section>
            )}

            <div className="border-t border-[var(--border)]" />

            {/* Reseñas — client component con paginación */}
            <HotelReviews
              hotelId={hotel.id}
              initialReviews={initialReviews as any[]}
              initialTotal={initialTotal}
              initialHasMore={initialHasMore}
              avgRating={avgRating}
              canReview={canReview}
              reviewableBookingId={reviewableBookingId}
              locale={locale}
            />
          </div>

          {/* Columna derecha — Booking widget */}
          <div className="lg:col-span-1">
            <BookingWidget
              hotelSlug={hotel.slug}
              roomTypes={(hotel.roomTypes ?? []) as any[]}
              extraServices={(hotel.extraServices ?? []) as any[]}
              locale={locale}
              isLoggedIn={isLoggedIn}
            />
          </div>
        </div>
      </main>

      {/* Footer mínimo */}
      <footer className="border-t border-[var(--border)] mt-16 py-6">
        <div className="max-w-7xl mx-auto px-5 text-xs text-[var(--text-muted)] text-center">
          © {new Date().getFullYear()} HotelesBoutique · Experiencias exclusivas
        </div>
      </footer>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────── */

function RoomCard({ rt }: { rt: any }) {
  return (
    <div className="bg-white border border-[var(--border)] rounded-2xl p-5 shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-sm)] hover:border-[var(--gold)]/30 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-bold text-[var(--text-primary)] text-sm group-hover:text-[var(--gold-dark)] transition-colors">{rt.name}</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5 flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Hasta {rt.capacity} personas
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-black text-[var(--text-primary)]">
            ${parseFloat(rt.pricePerNight).toLocaleString("es-CL")}
          </p>
          <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">/ noche</p>
        </div>
      </div>

      {rt.description && (
        <p className="text-xs text-[var(--text-secondary)] font-light leading-relaxed mb-3 line-clamp-2">
          {rt.description}
        </p>
      )}

      {rt.amenities?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {(rt.amenities as string[]).slice(0, 4).map((am) => (
            <span key={am} className="text-[10px] font-semibold bg-[var(--surface-2)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full border border-[var(--border)]">
              {am}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}


