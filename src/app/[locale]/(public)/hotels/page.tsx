import { Suspense } from "react";
import { getHotels } from "@/services/hotel.service";
import { auth } from "@/lib/auth/nextauth.config";
import { logoutAction } from "@/lib/auth/auth-actions";
import HotelFilters from "@/components/HotelFilters";
import FavButton from "@/components/FavButton";
import CompareButton from "@/components/CompareButton";
import ComparisonBar from "@/components/ComparisonBar";
import type { HotelCategory } from "@/types/domain";
import HotelsPageContent from "./HotelsPageContent";

export const dynamic = "force-dynamic";

const CAT_LABELS: Record<string, string> = {
  LUXURY: "Lujo", BOUTIQUE: "Boutique", ECO: "Eco",
  BEACH: "Playa", MOUNTAIN: "Montaña", CITY: "Ciudad",
};

const CAT_GRADIENT: Record<string, string> = {
  LUXURY:   "from-purple-600/80 to-indigo-800/80",
  BOUTIQUE: "from-rose-500/80 to-pink-700/80",
  ECO:      "from-emerald-600/80 to-teal-800/80",
  BEACH:    "from-sky-500/80 to-blue-700/80",
  MOUNTAIN: "from-amber-600/80 to-orange-800/80",
  CITY:     "from-gray-600/80 to-slate-800/80",
};

const CAT_BADGE: Record<string, string> = {
  LUXURY:   "bg-purple-50 text-purple-700 border-purple-200/80",
  BOUTIQUE: "bg-rose-50 text-rose-700 border-rose-200/80",
  ECO:      "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  BEACH:    "bg-sky-50 text-sky-700 border-sky-200/80",
  MOUNTAIN: "bg-amber-50 text-amber-700 border-amber-200/80",
  CITY:     "bg-gray-100 text-gray-600 border-gray-200/80",
};

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    query?: string; category?: string;
    maxPrice?: string; minStars?: string; page?: string; experience?: string;
  }>;
}

export default async function HotelsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;

  // Fetch session first — needed to know if we should load preferences
  const session = await auth();
  const userId = (session?.user as any)?.id ?? null;

  // Load preferences directly from DB (avoid internal HTTP round-trip)
  let preferredCategories: string[] = [];
  if (userId) {
    try {
      const { db } = await import("@/db");
      const { guestPreferences } = await import("@/db/schema");
      const { eq } = await import("drizzle-orm");
      const pref = await db.query.guestPreferences.findFirst({
        where: eq(guestPreferences.guestId, userId),
        columns: { preferredCategories: true },
      });
      preferredCategories = (pref?.preferredCategories as string[]) ?? [];
    } catch { /* silently ignore — preferences are best-effort */ }
  }

  const hotels = await getHotels({
    query:               sp.query,
    category:            sp.category as HotelCategory | undefined,
    maxPrice:            sp.maxPrice ? parseFloat(sp.maxPrice) : undefined,
    minStars:            sp.minStars ? parseInt(sp.minStars)   : undefined,
    page:                sp.page     ? parseInt(sp.page)       : 1,
    limit:               12,
    preferredCategories: preferredCategories.length > 0 ? preferredCategories : undefined,
    experienceType:      sp.experience,
  });

  const isFiltered       = !!(sp.query || sp.category || sp.maxPrice || sp.minStars || sp.experience);
  const isPersonalised   = !isFiltered && preferredCategories.length > 0;

  return (
    <HotelsPageContent
      locale={locale}
      hotels={hotels}
      session={session}
      isFiltered={isFiltered}
      isPersonalised={isPersonalised}
    />
  );
}

/* ── Sub-components ──────────────────────────────────────── */

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-all duration-200"
    >
      {label}
    </a>
  );
}

function HotelCard({ hotel, locale }: { hotel: any; locale: string }) {
  const gradient = CAT_GRADIENT[hotel.category] ?? "from-gray-600/80 to-slate-800/80";
  const badge    = CAT_BADGE[hotel.category]    ?? "bg-gray-100 text-gray-600 border-gray-200";

  return (
    <a
      href={`/${locale}/hotels/${hotel.slug}`}
      className="group block bg-white rounded-2xl overflow-hidden border border-[var(--border)] card-lift animate-slide-up"
    >
      {/* Imagen */}
      <div className="relative h-60 overflow-hidden bg-[var(--surface-2)]">
        {hotel.images?.[0] ? (
          <img
            src={hotel.images[0].url}
            alt={hotel.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">🏨</div>
        )}

        {/* Overlay gradiente en hover */}
        <div className={`absolute inset-0 bg-gradient-to-t ${gradient} opacity-0 group-hover:opacity-40 transition-opacity duration-500`} />

        {/* Badge categoría */}
        <div className="absolute top-3 left-3">
          <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border backdrop-blur-sm bg-white/80 ${badge}`}>
            {CAT_LABELS[hotel.category] ?? hotel.category}
          </span>
        </div>

        {/* Rating + Fav buttons */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {(hotel.avgRating || hotel.starRating) && (
            <div className="glass rounded-full px-2.5 py-1 flex items-center gap-1">
              <span className="text-[var(--gold)] text-xs">★</span>
              <span className="text-xs font-bold text-[var(--text-primary)]">
                {hotel.avgRating ?? hotel.starRating}
              </span>
            </div>
          )}
          <FavButton
            hotelId={hotel.id}
            hotelSlug={hotel.slug}
            hotelName={hotel.name}
            size="sm"
          />
        </div>
      </div>

      {/* Contenido */}
      <div className="p-5">
        <div className="mb-3">
          <h2 className="text-base font-bold text-[var(--text-primary)] leading-tight group-hover:text-[var(--gold-dark)] transition-colors duration-200 line-clamp-1">
            {hotel.name}
          </h2>
          <p className="text-sm text-[var(--text-muted)] font-medium mt-0.5 flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-60">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            {hotel.locationCity}, {hotel.locationCountry}
          </p>
        </div>

        {/* Estrellas */}
        <div className="flex items-center gap-0.5 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={`text-xs ${i < hotel.starRating ? "text-[var(--gold)]" : "text-[var(--border)]"}`}>★</span>
          ))}
        </div>

        {/* Precio + CTA */}
        <div className="flex items-end justify-between pt-3.5 border-t border-[var(--border)]">
          <div>
            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mb-0.5">Desde</p>
            {hotel.minPricePerNight ? (
              <p className="text-lg font-black text-[var(--text-primary)]">
                ${hotel.minPricePerNight.toLocaleString("es-CL")}
                <span className="text-xs font-normal text-[var(--text-muted)] ml-1">/noche</span>
              </p>
            ) : (
              <p className="text-sm font-medium text-[var(--text-muted)]">Consultar precio</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <CompareButton hotel={{
              id: hotel.id,
              slug: hotel.slug,
              name: hotel.name,
              category: hotel.category,
              starRating: hotel.starRating,
              locationCity: hotel.locationCity,
              minPricePerNight: hotel.minPricePerNight ?? null,
              imageUrl: hotel.images?.[0]?.url,
            }} />
            <div className="w-9 h-9 rounded-full bg-[var(--text-primary)] flex items-center justify-center group-hover:bg-[var(--gold)] transition-all duration-300 group-hover:shadow-[var(--shadow-gold)] group-hover:scale-110">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}

function EmptyState({ locale }: { locale: string }) {
  return (
    <div className="text-center py-24 bg-white rounded-2xl border border-[var(--border)] shadow-[var(--shadow-xs)] animate-fade-in">
      <div className="text-5xl mb-4 opacity-30">🔍</div>
      <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Sin resultados</h3>
      <p className="text-[var(--text-muted)] text-sm mb-6 max-w-xs mx-auto">
        No encontramos hoteles con esos filtros. Prueba con otros criterios o explora todos.
      </p>
      <a
        href={`/${locale}/hotels`}
        className="inline-flex items-center gap-2 text-sm font-semibold bg-[var(--text-primary)] text-white px-6 py-2.5 rounded-full hover:bg-[var(--gold)] hover:shadow-[var(--shadow-gold)] transition-all duration-300"
      >
        Ver todos los hoteles
      </a>
    </div>
  );
}