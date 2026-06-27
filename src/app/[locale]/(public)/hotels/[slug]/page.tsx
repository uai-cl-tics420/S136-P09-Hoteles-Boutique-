import { notFound } from "next/navigation";
import { getHotelBySlug } from "@/services/hotel.service";
import { getReviewsByHotel } from "@/services/review.service";
import { auth } from "@/lib/auth/nextauth.config";
import BookingWidget from "@/components/BookingWidget";
import HotelReviews from "@/components/HotelReviews";
import FavButton from "@/components/FavButton";
import HotelImg from "@/components/HotelImg";
import SimilarHotels from "@/components/SimilarHotels";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const UI = {
  es: {
    backToHotels: "Hoteles", about: "Sobre este hotel", rooms: "Habitaciones",
    location: "Ubicación", mapsLink: "Ver en Maps", upTo: "Hasta",
    people: "personas", perNight: "/ noche", reviews: "reseñas",
    morePhotos: "fotos", footer: "HotelesBoutique · Experiencias exclusivas",
    amenities: "Amenidades", maxCapacity: "capacidad máx.",
  },
  en: {
    backToHotels: "Hotels", about: "About this hotel", rooms: "Room Types",
    location: "Location", mapsLink: "View on Maps", upTo: "Up to",
    people: "people", perNight: "/ night", reviews: "reviews",
    morePhotos: "photos", footer: "BoutiqueHotels · Exclusive experiences",
    amenities: "Amenities", maxCapacity: "max capacity",
  },
} as const;

const CAT_BADGE: Record<string, string> = {
  LUXURY: "bg-purple-50 text-purple-700 border-purple-200",
  BOUTIQUE: "bg-rose-50 text-rose-700 border-rose-200",
  ECO: "bg-emerald-50 text-emerald-700 border-emerald-200",
  BEACH: "bg-sky-50 text-sky-700 border-sky-200",
  MOUNTAIN: "bg-amber-50 text-amber-700 border-amber-200",
  CITY: "bg-gray-100 text-gray-600 border-gray-200",
};

const CAT_LABELS_MAP: Record<string, Record<string, string>> = {
  es: { LUXURY: "Lujo", BOUTIQUE: "Boutique", ECO: "Eco", BEACH: "Playa", MOUNTAIN: "Montaña", CITY: "Ciudad" },
  en: { LUXURY: "Luxury", BOUTIQUE: "Boutique", ECO: "Eco", BEACH: "Beach", MOUNTAIN: "Mountain", CITY: "City" },
};

interface PageProps { params: Promise<{ slug: string; locale: string }>; }

export default async function HotelDetailPage({ params }: PageProps) {
  const { slug, locale } = await params;
  const ui = UI[locale as keyof typeof UI] ?? UI.es;
  const catLabels = CAT_LABELS_MAP[locale] ?? CAT_LABELS_MAP.es;

  const hotel = await getHotelBySlug(slug);
  if (!hotel) notFound();

  const PAGE_SIZE = 5;
  const [allReviews, session] = await Promise.all([getReviewsByHotel(hotel.id), auth()]);
  const initialReviews = allReviews.slice(0, PAGE_SIZE);
  const initialTotal   = allReviews.length;
  const initialHasMore = initialTotal > PAGE_SIZE;

  const isLoggedIn = !!session?.user;
  const userId = (session?.user as any)?.id ?? null;

  let canReview = false;
  let reviewableBookingId: string | null = null;
  if (userId) {
    const hotelRoomIds = (hotel.roomTypes ?? []).map((r: any) => r.id);
    if (hotelRoomIds.length > 0) {
      const completedBooking = await db.query.bookings.findFirst({
        where: (b, { and, inArray }) => and(eq(b.guestId, userId), eq(b.status, "COMPLETED"), inArray(b.roomTypeId, hotelRoomIds)),
      });
      canReview = !!completedBooking;
      reviewableBookingId = completedBooking?.id ?? null;
    }
  }

  const avgRating = allReviews.length
    ? (allReviews.reduce((a, r) => a + r.ratingOverall, 0) / allReviews.length).toFixed(1)
    : null;

  const badge     = CAT_BADGE[hotel.category] ?? "bg-gray-100 text-gray-600 border-gray-200";
  const mainImage = hotel.images?.[0];
  const thumbs    = hotel.images?.slice(1) ?? [];

  return (
    <div className="min-h-screen bg-[var(--background)]">

      {/* ── Sticky Breadcrumb Navbar ──────────────────────────── */}
      <header className="sticky top-0 z-50 glass border-b border-[var(--border-soft)] shadow-[0_2px_16px_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto px-5 h-14 flex items-center gap-3">
          <a
            href={`/${locale}/hotels`}
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors group"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform">
              <path d="m15 18-6-6 6-6"/>
            </svg>
            {ui.backToHotels}
          </a>
          <span className="text-[var(--border)] select-none">/</span>
          <span className="text-xs font-bold text-[var(--text-primary)] truncate max-w-[240px] sm:max-w-[420px]">
            {hotel.name}
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 py-10">

        {/* ── Hero Header ───────────────────────────────────────── */}
        <div className="mb-10 animate-slide-up">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border ${badge}`}>
              {catLabels[hotel.category] ?? hotel.category}
            </span>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: hotel.starRating }).map((_, i) => (
                <span key={i} className="text-[var(--gold)] text-sm">★</span>
              ))}
            </div>
            {avgRating && (
              <span className="inline-flex items-center gap-1 text-xs font-bold bg-[var(--gold-lighter)] text-[var(--gold-dark)] px-3 py-1.5 rounded-full border border-[var(--gold)]/30">
                ★ {avgRating} · {initialTotal} {ui.reviews}
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-4xl md:text-6xl font-black text-[var(--text-primary)] tracking-[-0.03em] mb-3 leading-[1.0]">
                {hotel.name}
              </h1>
              <div className="flex items-center gap-3">
                <p className="flex items-center gap-1.5 text-[var(--text-muted)] text-sm font-medium">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  {hotel.locationCity}, {hotel.locationCountry}
                  {hotel.address && <><span className="mx-1 text-[var(--border)]">·</span><span className="text-[var(--text-muted)]/70">{hotel.address}</span></>}
                </p>
                <FavButton hotelId={hotel.id} hotelSlug={hotel.slug} hotelName={hotel.name} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Gallery Bento ─────────────────────────────────────── */}
        <div className="mb-12 animate-scale-in">
          {mainImage ? (
            <div className="grid grid-cols-1 md:grid-cols-5 md:grid-rows-2 gap-2.5 rounded-3xl overflow-hidden h-[300px] md:h-[480px]">
              {/* Main large image */}
              <div className="md:col-span-3 md:row-span-2 relative overflow-hidden group">
                <HotelImg
                  src={mainImage.url}
                  alt={hotel.name}
                  fallbackSeed={hotel.id}
                  className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-105"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              {/* Thumbnails 2x2 grid */}
              {thumbs.slice(0, 4).map((img: any, i: number) => (
                <div key={img.id} className="relative overflow-hidden group hidden md:block">
                  {img.url && (
                    <HotelImg
                      src={img.url}
                      alt={`${hotel.name} — ${i + 2}`}
                      fallbackSeed={hotel.id + String(i)}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                  )}
                  {i === 3 && thumbs.length > 4 && (
                    <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px] flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-white text-xl font-black">+{thumbs.length - 4}</p>
                        <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">{ui.morePhotos}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {/* Fill empty cells */}
              {Array.from({ length: Math.max(0, 4 - thumbs.length) }).map((_, i) => (
                <div key={`e-${i}`} className="bg-[var(--surface-2)] hidden md:block" />
              ))}
            </div>
          ) : (
            <div className="h-80 bg-gradient-to-br from-[var(--surface-2)] to-[var(--border)] rounded-3xl flex items-center justify-center text-6xl opacity-15">🏨</div>
          )}
        </div>

        {/* ── Main Layout ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12">

          {/* Left column */}
          <div className="space-y-12">

            {/* Description */}
            {hotel.description && (
              <section className="animate-slide-up">
                <SectionTitle>{ui.about}</SectionTitle>
                <p className="text-[var(--text-secondary)] leading-[1.9] font-light text-[15px]">
                  {hotel.description.replace(/\[GUEST_CONFIG\][\s\S]*?\[\/GUEST_CONFIG\]/g, "").trim()}
                </p>
              </section>
            )}

            {/* Rooms */}
            {hotel.roomTypes?.length > 0 && (
              <section className="animate-slide-up">
                <SectionTitle>{ui.rooms}</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hotel.roomTypes.map((rt: any) => (
                    <RoomCard key={rt.id} rt={rt} ui={ui} />
                  ))}
                </div>
              </section>
            )}

            {/* Divider */}
            <div className="divider-gold" />

            {/* Location */}
            {hotel.address && (
              <section className="animate-slide-up">
                <SectionTitle>{ui.location}</SectionTitle>
                <div className="bg-white border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4 shadow-[var(--shadow-xs)] mb-4 hover:shadow-[var(--shadow-sm)] transition-shadow">
                  <div className="w-11 h-11 bg-[var(--gold-lighter)] rounded-xl flex items-center justify-center text-lg shrink-0">📍</div>
                  <div className="flex-1">
                    <p className="font-bold text-[var(--text-primary)] text-sm">{hotel.address}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{hotel.locationCity}, {hotel.locationCountry}</p>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${hotel.name} ${hotel.address} ${hotel.locationCity}`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-[var(--gold-dark)] hover:text-[var(--gold)] bg-[var(--gold-lighter)] hover:bg-[var(--gold-light)] px-3.5 py-2 rounded-xl transition-all"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                    {ui.mapsLink}
                  </a>
                </div>
                <div className="rounded-2xl overflow-hidden border border-[var(--border)] shadow-[var(--shadow-xs)] h-64">
                  <iframe
                    title={`Mapa de ${hotel.name}`}
                    width="100%" height="100%" loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(`${hotel.name} ${hotel.address} ${hotel.locationCity}`)}&output=embed`}
                    className="w-full h-full border-0"
                  />
                </div>
              </section>
            )}

            <div className="divider-gold" />

            {/* Reviews */}
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

          {/* Right column — sticky booking widget */}
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

      {/* Similar Hotels */}
      <section className="max-w-7xl mx-auto px-5 pb-16">
        <div className="divider-gold mb-12" />
        <SimilarHotels
          hotelId={hotel.id}
          category={hotel.category}
          locationCity={hotel.locationCity}
          locale={locale}
        />
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] mt-20 py-8">
        <div className="max-w-7xl mx-auto px-5 flex items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-[var(--text-primary)] flex items-center justify-center text-[var(--gold)] text-[8px] font-black">HB</span>
            <span>© {new Date().getFullYear()} {ui.footer}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Helpers ──────────────────────────────────────────────── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <h2 className="text-xl font-black text-[var(--text-primary)] tracking-[-0.02em]">{children}</h2>
      <div className="flex-1 h-px bg-[var(--border)]" />
    </div>
  );
}

function RoomCard({ rt, ui }: { rt: any; ui: typeof UI[keyof typeof UI] }) {
  return (
    <div className="group bg-white border border-[var(--border)] rounded-2xl p-5 shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-md)] hover:border-[var(--gold)]/40 hover:-translate-y-1 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <p className="font-black text-[var(--text-primary)] text-[15px] group-hover:text-[var(--gold-dark)] transition-colors line-clamp-1">{rt.name}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            {ui.upTo} {rt.capacity} {ui.people}
          </p>
        </div>
        <div className="text-right shrink-0 ml-4 bg-[var(--surface-2)] rounded-xl px-3 py-2">
          <p className="text-lg font-black text-[var(--text-primary)]">${parseFloat(rt.pricePerNight).toLocaleString("es-CL")}</p>
          <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest">{ui.perNight}</p>
        </div>
      </div>

      {rt.description && (
        <p className="text-xs text-[var(--text-secondary)] font-light leading-relaxed mb-4 line-clamp-2">
          {rt.description}
        </p>
      )}

      {rt.amenities?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-3 border-t border-[var(--border-soft)]">
          {(rt.amenities as string[]).slice(0, 5).map((am) => (
            <span key={am} className="text-[10px] font-semibold bg-[var(--surface-2)] text-[var(--text-secondary)] px-2.5 py-1 rounded-lg border border-[var(--border)]">
              {am}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
