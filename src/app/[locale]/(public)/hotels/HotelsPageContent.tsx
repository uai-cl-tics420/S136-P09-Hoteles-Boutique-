"use client";
import { loadTranslations } from "@/i18n/i18n-util";
import { logoutAction } from "@/lib/auth/auth-actions";
import FavButton from "@/components/FavButton";
import CompareButton from "@/components/CompareButton";
import ComparisonBar from "@/components/ComparisonBar";
import HotelFilters from "@/components/HotelFilters";
import { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

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

interface Props {
  locale: string;
  hotels: any[];
  session: any;
  isFiltered: boolean;
  isPersonalised: boolean;
}

export default function HotelsPageContent({ locale, hotels, session, isFiltered, isPersonalised }: Props) {
  const [t, setT] = useState<any>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    loadTranslations(locale as any).then(setT);
  }, [locale]);

  const getLanguageSwitchUrl = (newLocale: string) => {
    if (!pathname) return `/${newLocale}`;
    const segments = pathname.split('/');
    segments[1] = newLocale; 
    const newPath = segments.join('/');
    const currentParams = searchParams?.toString();
    return currentParams ? `${newPath}?${currentParams}` : newPath;
  };

  if (!t) return null;

  return (
    <div className="min-h-screen bg-[var(--background)]">

      {/* ── Navbar Floating Glass ────────────────────────────── */}
      <div className="sticky top-2 z-50 px-4 mb-4">
        <header className="max-w-7xl mx-auto min-h-[4rem] py-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 bg-white/80 backdrop-blur-2xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-3xl px-6 transition-all duration-300">
          {/* Logo */}
          <a href={`/${locale}/hotels`} className="flex items-center gap-2 group">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-black to-gray-800 flex items-center justify-center text-[var(--gold)] text-sm font-black group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(201,168,76,0.5)] transition-all duration-300">
              HB
            </span>
            <span className="text-[17px] font-black text-black tracking-tight">
              Hoteles<span className="font-light text-[var(--gold-dark)]">Boutique</span>
            </span>
          </a>

          {/* Nav */}
          <nav className="flex flex-wrap items-center gap-2">
            
            {/* Language Switcher */}
            <div className="flex items-center bg-black/5 rounded-xl p-1 border border-black/5 mr-1">
              <a 
                href={getLanguageSwitchUrl("es")}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all ${locale === "es" ? "bg-white shadow-sm text-[var(--text-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
              >
                ES
              </a>
              <a 
                href={getLanguageSwitchUrl("en")}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all ${locale === "en" ? "bg-white shadow-sm text-[var(--text-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
              >
                EN
              </a>
            </div>

            <NavLink href={`/${locale}/reviews`} label={t("nav.rankings")} icon="⭐" />
            {session?.user ? (
              <>
                <NavLink href={`/${locale}/bookings`} label={t("nav.myBookings")} icon="📅" />
                <NavLink href={`/${locale}/profile`}  label={t("nav.myProfile")} icon="👤" />
                {(["HOTEL_ADMIN", "SUPER_ADMIN"] as const).includes((session.user as any).role) && (
                  <NavLink href={`/${locale}/admin`} label={t("nav.adminPanel")} icon="⚙️" highlight />
                )}
                <button
                  onClick={() => logoutAction(locale)}
                  className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 px-4 py-2 rounded-xl transition-all duration-300 shadow-sm ml-1 hover:-translate-y-0.5"
                >
                  🚪 {t("auth.logout")}
                </button>
              </>
            ) : (
              <a
                href={`/${locale}/auth/login`}
                className="flex items-center gap-1.5 text-xs font-bold bg-gradient-to-r from-[var(--gold)] to-[var(--gold-dark)] text-white px-5 py-2.5 rounded-xl hover:shadow-[0_4px_15px_rgba(201,168,76,0.4)] hover:-translate-y-0.5 transition-all duration-300"
              >
                🔑 {t("auth.login")}
              </a>
            )}
          </nav>
        </header>
      </div>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0f0f0f] text-white rounded-b-[2.5rem] shadow-2xl mb-8">
        {/* Animated Orbs */}
        <div className="absolute -top-32 -left-32 w-[40rem] h-[40rem] bg-[var(--gold)]/15 rounded-full blur-[100px] animate-pulse mix-blend-screen" />
        <div className="absolute top-20 -right-20 w-[30rem] h-[30rem] bg-orange-600/10 rounded-full blur-[100px] animate-pulse mix-blend-screen" style={{ animationDelay: "1s" }}/>
        
        {/* Fondo con patrón sutil */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90" />

        <div className="relative max-w-7xl mx-auto px-5 pt-16 md:pt-24 pb-16 md:pb-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-white/80 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6 animate-fade-in">
            <span className="w-1.5 h-1.5 bg-[var(--gold)] rounded-full" />
            {t("hotels.hero.badge")}
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 animate-slide-up leading-[1.05]">
            {t("hotels.hero.title")}<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--gold-light)] via-[var(--gold)] to-orange-400">
              {t("hotels.hero.titleHighlight")}
            </span>
          </h1>
          <p className="text-white/60 text-lg font-light max-w-xl mx-auto animate-slide-up-delay">
            {t("hotels.hero.description")}
          </p>

          {/* Stats */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 mt-12 animate-fade-in">
            {[
              { value: "150+",  label: t("hotels.hero.statsHotels") },
              { value: "100%",  label: t("hotels.hero.statsBoutique") },
              { value: "4.8★",  label: t("hotels.hero.statsRating") },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-black text-[var(--gold)]">{value}</p>
                <p className="text-xs text-white/50 font-medium uppercase tracking-widest mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Wave bottom */}
        <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-[var(--background)] to-transparent" />
      </section>

      {/* ── Contenido ────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-5 py-10">

        {/* Filtros */}
        <div className="relative">
          <HotelFilters />
        </div>

        {/* Cabecera de resultados */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-[var(--text-muted)] font-medium">
              {isFiltered
                ? `${hotels.length} ${hotels.length !== 1 ? t("hotels.results.found") : t("hotels.results.foundSingular")}`
                : `${hotels.length} ${t("hotels.results.available")}`
              }
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isPersonalised && (
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest bg-[var(--gold-light)] text-[var(--gold-dark)] px-3 py-1.5 rounded-full border border-[var(--gold)]/30">
                ✨ {t("hotels.results.personalized")}
              </span>
            )}
            <div className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-widest">
              {isPersonalised ? t("hotels.results.relevance") : t("hotels.results.orderBy")}
            </div>
          </div>
        </div>

        {/* Grid de hoteles */}
        {hotels.length === 0 ? (
          <EmptyState locale={locale} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {hotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} locale={locale} />
            ))}
          </div>
        )}
        <ComparisonBar locale={locale} />
      </main>

      {/* ── Footer mínimo ────────────────────────────────────── */}
      <footer className="border-t border-[var(--border)] mt-20 py-8">
        <div className="max-w-7xl mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[var(--text-muted)] text-center md:text-left">
          <p>{t("common.copyright")} {new Date().getFullYear()} {t("common.copyrightText")}</p>
          <div className="flex flex-wrap justify-center md:justify-end gap-5 font-medium">
            <a href="#" className="hover:text-[var(--gold)] transition-colors">{t("common.terms")}</a>
            <a href="#" className="hover:text-[var(--gold)] transition-colors">{t("common.privacy")}</a>
            <a href="#" className="hover:text-[var(--gold)] transition-colors">{t("common.contact")}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────── */

function NavLink({ href, label, icon, highlight }: { href: string; label: string; icon?: string; highlight?: boolean }) {
  return (
    <a
      href={href}
      className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all duration-300 shadow-sm hover:-translate-y-0.5 ${
        highlight 
          ? "bg-gradient-to-r from-[var(--gold)]/10 to-[var(--gold)]/20 text-[var(--gold-dark)] hover:from-[var(--gold)]/20 hover:to-[var(--gold)]/30 border border-[var(--gold)]/30" 
          : "bg-black/5 text-[var(--text-primary)] hover:bg-black/10 border border-transparent"
      }`}
    >
      {icon && <span className="text-[14px]">{icon}</span>}
      {label}
    </a>
  );
}

function HotelCard({ hotel, locale }: { hotel: any; locale: string }) {
  const [t, setT] = useState<any>(null);

  useEffect(() => {
    loadTranslations(locale as any).then(setT);
  }, [locale]);

  if (!t) return null;
  const gradient = CAT_GRADIENT[hotel.category] ?? "from-gray-600/80 to-slate-800/80";
  const badge    = CAT_BADGE[hotel.category]    ?? "bg-gray-100 text-gray-600 border-gray-200";

  return (
    <a
      href={`/${locale}/hotels/${hotel.slug}`}
      className="group block bg-white rounded-3xl overflow-hidden border border-black/5 shadow-sm hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:-translate-y-2 transition-all duration-500 animate-slide-up"
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
            <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mb-0.5">{t("common.from")}</p>
            {hotel.minPricePerNight ? (
              <p className="text-lg font-black text-[var(--text-primary)]">
                ${hotel.minPricePerNight.toLocaleString("es-CL")}
                <span className="text-xs font-normal text-[var(--text-muted)] ml-1">{t("common.perNight")}</span>
              </p>
            ) : (
              <p className="text-sm font-medium text-[var(--text-muted)]">{t("hotels.consultPrice")}</p>
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
  const [t, setT] = useState<any>(null);

  useEffect(() => {
    loadTranslations(locale as any).then(setT);
  }, [locale]);

  if (!t) return null;
  return (
    <div className="text-center py-24 bg-white rounded-2xl border border-[var(--border)] shadow-[var(--shadow-xs)] animate-fade-in">
      <div className="text-5xl mb-4 opacity-30">🔍</div>
      <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{t("hotels.results.emptyTitle")}</h3>
      <p className="text-[var(--text-muted)] text-sm mb-6 max-w-xs mx-auto">
        {t("hotels.results.emptyDescription")}
      </p>
      <a
        href={`/${locale}/hotels`}
        className="inline-flex items-center gap-2 text-sm font-semibold bg-[var(--text-primary)] text-white px-6 py-2.5 rounded-full hover:bg-[var(--gold)] hover:shadow-[var(--shadow-gold)] transition-all duration-300"
      >
        {t("hotels.results.viewAll")}
      </a>
    </div>
  );
}
