"use client";
import { loadTranslations } from "@/i18n/i18n-util";
import { logoutAction } from "@/lib/auth/auth-actions";
import FavButton from "@/components/FavButton";
import CompareButton from "@/components/CompareButton";
import ComparisonBar from "@/components/ComparisonBar";
import HotelFilters from "@/components/HotelFilters";
import AIConciergeSearch from "@/components/AIConciergeSearch";
import { useState, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const CAT_LABELS: Record<string, string> = {
  LUXURY: "Lujo", BOUTIQUE: "Boutique", ECO: "Eco",
  BEACH: "Playa", MOUNTAIN: "Montaña", CITY: "Ciudad",
};

// Inferred services per category for visual preview on cards
const CAT_SERVICES: Record<string, { icon: string; label: string }[]> = {
  LUXURY:   [{ icon: "💆", label: "Spa" }, { icon: "🍽️", label: "Gourmet" }, { icon: "🚗", label: "Transfer" }],
  BOUTIQUE: [{ icon: "☕", label: "Desayuno" }, { icon: "💆", label: "Masajes" }, { icon: "🗺️", label: "Tours" }],
  ECO:      [{ icon: "🥾", label: "Trekking" }, { icon: "🧘", label: "Yoga" }, { icon: "🌿", label: "Eco" }],
  BEACH:    [{ icon: "🤿", label: "Snorkel" }, { icon: "🍹", label: "Beach bar" }, { icon: "💆", label: "Spa" }],
  MOUNTAIN: [{ icon: "🏔️", label: "Senderismo" }, { icon: "🔥", label: "Fogón" }, { icon: "🌄", label: "Vista" }],
  CITY:     [{ icon: "🚕", label: "Transfer" }, { icon: "🍷", label: "Cena" }, { icon: "🎭", label: "Tours" }],
};

const CAT_COLOR: Record<string, { badge: string; glow: string; overlay: string; dot: string }> = {
  LUXURY:   { badge: "bg-purple-950/80 text-purple-200 border-purple-500/30",  glow: "rgba(168,85,247,0.35)",  overlay: "from-purple-900/70 via-indigo-900/40",   dot: "bg-purple-400" },
  BOUTIQUE: { badge: "bg-rose-950/80 text-rose-200 border-rose-500/30",        glow: "rgba(244,63,94,0.35)",   overlay: "from-rose-900/70 via-pink-900/40",       dot: "bg-rose-400" },
  ECO:      { badge: "bg-emerald-950/80 text-emerald-200 border-emerald-500/30", glow: "rgba(16,185,129,0.35)", overlay: "from-emerald-900/70 via-teal-900/40",    dot: "bg-emerald-400" },
  BEACH:    { badge: "bg-sky-950/80 text-sky-200 border-sky-500/30",            glow: "rgba(14,165,233,0.35)",  overlay: "from-sky-900/70 via-blue-900/40",       dot: "bg-sky-400" },
  MOUNTAIN: { badge: "bg-amber-950/80 text-amber-200 border-amber-500/30",      glow: "rgba(245,158,11,0.35)",  overlay: "from-amber-900/70 via-orange-900/40",   dot: "bg-amber-400" },
  CITY:     { badge: "bg-zinc-900/80 text-zinc-200 border-zinc-600/30",         glow: "rgba(113,113,122,0.35)", overlay: "from-zinc-900/70 via-slate-900/40",      dot: "bg-zinc-400" },
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
  const pathname  = usePathname();
  const searchParams = useSearchParams();
  const [showNav, setShowNav] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setShowNav(y < lastScrollY.current || y < 80);
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    loadTranslations(locale as any).then(setT);
  }, [locale]);

  const getLangUrl = (newLocale: string) => {
    if (!pathname) return `/${newLocale}`;
    const segs = pathname.split("/");
    segs[1] = newLocale;
    const qs = searchParams?.toString();
    return qs ? `${segs.join("/")}?${qs}` : segs.join("/");
  };

  if (!t) return null;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <ScrollProgress />

      {/* ── Navbar Floating Pill ─────────────────────────────── */}
      <div className={`fixed top-3 left-0 right-0 z-50 px-4 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${showNav ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}`}>
        <header className="max-w-7xl mx-auto flex items-center justify-between gap-4 bg-white/85 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.10),0_1px_2px_rgba(0,0,0,0.05)] rounded-[2rem] px-5 py-2.5 transition-all duration-300">
          {/* Logo */}
          <a href={`/${locale}/hotels`} className="flex items-center gap-2.5 group shrink-0">
            <span className="w-8 h-8 rounded-xl bg-[var(--text-primary)] flex items-center justify-center text-[var(--gold)] text-[11px] font-black group-hover:scale-110 group-hover:shadow-[0_0_16px_rgba(201,150,58,0.5)] transition-all duration-300">
              HB
            </span>
            <span className="hidden sm:block text-[15px] font-black text-[var(--text-primary)] tracking-tight">
              Hoteles<span className="font-light text-[var(--gold-dark)]">Boutique</span>
            </span>
          </a>

          {/* Nav links */}
          <nav className="flex items-center gap-1.5 flex-wrap">
            {/* Lang switcher */}
            <div className="flex items-center bg-[var(--surface-2)] rounded-lg p-0.5 border border-[var(--border)] mr-1">
              {["es","en"].map(l => (
                <a key={l} href={getLangUrl(l)} className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-all ${locale === l ? "bg-white shadow-sm text-[var(--text-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>
                  {l.toUpperCase()}
                </a>
              ))}
            </div>

            <NavLink href={`/${locale}/reviews`}  label={t("nav.rankings")}   icon="✦" />
            {session?.user ? (
              <>
                <NavLink href={`/${locale}/bookings`} label={t("nav.myBookings")} icon="◈" />
                <NavLink href={`/${locale}/profile`}  label={t("nav.myProfile")}  icon="◉" />
                {(["HOTEL_ADMIN","SUPER_ADMIN"] as const).includes((session.user as any).role) && (
                  <NavLink href={`/${locale}/admin`} label={t("nav.adminPanel")} icon="⬡" highlight />
                )}
                <button
                  onClick={() => logoutAction(locale)}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all duration-200"
                >
                  {t("auth.logout")}
                </button>
              </>
            ) : (
              <a
                href={`/${locale}/auth/login`}
                className="btn-gold flex items-center gap-1.5 text-[11px] px-4 py-2 rounded-xl"
              >
                {t("auth.login")}
              </a>
            )}
          </nav>
        </header>
      </div>

      {/* ── Hero Dark ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden aurora-bg text-white rounded-b-[3rem] shadow-[var(--shadow-xl)] pt-20">
        {/* Animated orbs */}
        <div className="absolute -top-40 -left-40 w-[50rem] h-[50rem] bg-[var(--gold)]/12 rounded-full blur-[120px] animate-orb pointer-events-none" />
        <div className="absolute top-10 -right-32 w-[38rem] h-[38rem] bg-orange-700/10 rounded-full blur-[100px] animate-orb pointer-events-none" style={{ animationDelay: "2.5s" }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60rem] h-32 bg-[var(--background)]/20 rounded-full blur-[40px] pointer-events-none" />

        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "36px 36px" }} />

        {/* Gold top border */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--gold)]/60 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-5 pt-20 pb-28 md:pt-28 md:pb-36 text-center">
          {/* Badge pill */}
          <div className="inline-flex items-center gap-2 glass-gold text-[var(--gold-shine)] text-[11px] font-bold uppercase tracking-[0.2em] px-5 py-2 rounded-full mb-8 animate-fade-in">
            <span className="w-1.5 h-1.5 bg-[var(--gold)] rounded-full animate-pulse" />
            {t("hotels.hero.badge")}
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-[-0.04em] mb-6 animate-slide-up leading-[0.95]">
            {t("hotels.hero.title")}<br />
            <span className="text-gradient-gold">{t("hotels.hero.titleHighlight")}</span>
          </h1>

          <p className="text-white/55 text-lg md:text-xl font-light max-w-lg mx-auto animate-slide-up-delay leading-relaxed">
            {t("hotels.hero.description")}
          </p>

          {/* Stats row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-0 mt-16 animate-fade-in">
            {[
              { value: "150+", label: t("hotels.hero.statsHotels") },
              { value: "100%", label: t("hotels.hero.statsBoutique") },
              { value: "4.8★", label: t("hotels.hero.statsRating") },
            ].map(({ value, label }, i) => (
              <div key={label} className="flex items-center">
                <div className="text-center px-8 py-4">
                  <p className="text-3xl md:text-4xl font-black text-gradient-gold">{value}</p>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">{label}</p>
                </div>
                {i < 2 && <div className="hidden sm:block w-px h-10 bg-white/10" />}
              </div>
            ))}
          </div>
        </div>

        {/* Wave fade to bg */}
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[var(--background)] to-transparent pointer-events-none" />
      </section>

      {/* ── Contenido ────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-5 py-12">

        {/* ── AI Concierge Section ──────────────────────────────── */}
        <div className="mb-10">
          {/* Section header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[var(--gold-shine)] to-[var(--gold-dark)] flex items-center justify-center text-white text-sm">
              ✦
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--gold-dark)]">AI Luxury Concierge</p>
              <p className="text-[10px] text-[var(--text-muted)] font-medium">Búsqueda inteligente en lenguaje natural</p>
            </div>
          </div>
          <AIConciergeSearch locale={locale} />
        </div>

        {/* Divider between AI and classic filters */}
        <div className="flex items-center gap-4 my-10">
          <div className="flex-1 h-px bg-[var(--border)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] shrink-0">
            ó explora con filtros
          </span>
          <div className="flex-1 h-px bg-[var(--border)]" />
        </div>

        {/* Classic Filters */}
        <div className="relative mb-2">
          <HotelFilters />
        </div>

        {/* Results header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold text-[var(--text-muted)]">
              {isFiltered
                ? `${hotels.length} ${hotels.length !== 1 ? t("hotels.results.found") : t("hotels.results.foundSingular")}`
                : `${hotels.length} ${t("hotels.results.available")}`
              }
            </p>
            {isPersonalised && (
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest bg-[var(--gold-lighter)] text-[var(--gold-dark)] px-3 py-1.5 rounded-full border border-[var(--gold)]/30">
                ✦ {t("hotels.results.personalized")}
              </span>
            )}
          </div>
          <p className="text-[11px] text-[var(--text-muted)] font-medium uppercase tracking-widest hidden sm:block">
            {isPersonalised ? t("hotels.results.relevance") : t("hotels.results.orderBy")}
          </p>
        </div>

        {/* Grid */}
        {hotels.length === 0 ? (
          <EmptyState locale={locale} t={t} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7 stagger-children">
            {hotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} locale={locale} t={t} />
            ))}
          </div>
        )}

        <ComparisonBar locale={locale} />
      </main>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="mt-24 border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-5 py-10 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-lg bg-[var(--text-primary)] flex items-center justify-center text-[var(--gold)] text-[8px] font-black">HB</span>
            <p className="font-medium">{t("common.copyright")} {new Date().getFullYear()} {t("common.copyrightText")}</p>
          </div>
          <div className="flex flex-wrap justify-center md:justify-end gap-6 font-medium">
            <a href="#" className="hover:text-[var(--gold)] transition-colors">{t("common.terms")}</a>
            <a href="#" className="hover:text-[var(--gold)] transition-colors">{t("common.privacy")}</a>
            <a href="#" className="hover:text-[var(--gold)] transition-colors">{t("common.contact")}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── NavLink ──────────────────────────────────────────────── */
function NavLink({ href, label, icon, highlight }: { href: string; label: string; icon?: string; highlight?: boolean }) {
  return (
    <a
      href={href}
      className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all duration-200 ${
        highlight
          ? "text-[var(--gold-dark)] bg-[var(--gold-lighter)] border border-[var(--gold)]/25 hover:bg-[var(--gold-light)]"
          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
      }`}
    >
      {icon && <span className="text-[10px] opacity-70">{icon}</span>}
      {label}
    </a>
  );
}

/* ── HotelCard ────────────────────────────────────────────── */
function HotelCard({ hotel, locale, t }: { hotel: any; locale: string; t: any }) {
  const colors   = CAT_COLOR[hotel.category] ?? CAT_COLOR.CITY;
  const services = CAT_SERVICES[hotel.category] ?? [];
  const isPopular = (hotel.avgRating && hotel.avgRating >= 4.5) || hotel.starRating === 5;

  return (
    <a
      href={`/${locale}/hotels/${hotel.slug}`}
      className="group block bg-white rounded-[1.75rem] overflow-hidden border border-[var(--border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-lg)] hover:-translate-y-2.5 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] relative"
    >
      {/* ── Image ───────────────────────────────────────────── */}
      <div className="relative h-56 overflow-hidden bg-[var(--surface-2)]">
        {hotel.images?.[0] ? (
          <img
            src={hotel.images[0].url}
            alt={hotel.name}
            className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl opacity-10 bg-gradient-to-br from-[var(--surface-2)] to-[var(--border)]">🏨</div>
        )}

        {/* Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

        {/* Top: category + popular + fav */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-start justify-between">
          <div className="flex flex-col gap-1.5">
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border backdrop-blur-md ${colors.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} animate-pulse`} />
              {CAT_LABELS[hotel.category] ?? hotel.category}
            </span>
            {isPopular && (
              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-[var(--gold)]/90 text-white backdrop-blur-md shadow-[var(--shadow-gold)]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="ping-gold absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                </span>
                Popular
              </span>
            )}
          </div>

          {/* Rating + Fav */}
          <div className="flex items-center gap-1.5">
            {(hotel.avgRating || hotel.starRating) && (
              <div className="glass-dark rounded-full px-2.5 py-1 flex items-center gap-1 backdrop-blur-md">
                <span className="text-[var(--gold-shine)] text-xs">★</span>
                <span className="text-[11px] font-bold text-white">{hotel.avgRating ?? hotel.starRating}</span>
              </div>
            )}
            <FavButton hotelId={hotel.id} hotelSlug={hotel.slug} hotelName={hotel.name} size="sm" />
          </div>
        </div>

        {/* Bottom: name slides up on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-1 group-hover:translate-y-0 transition-transform duration-400">
          <p className="text-white font-black text-lg leading-tight drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] line-clamp-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {hotel.name}
          </p>
        </div>
      </div>

      {/* ── Card body ───────────────────────────────────────── */}
      <div className="p-5">
        {/* Star rating row */}
        <div className="flex items-center gap-0.5 mb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={`text-[11px] ${i < hotel.starRating ? "text-[var(--gold)]" : "text-[var(--border)]"}`}>★</span>
          ))}
        </div>

        {/* Name + location */}
        <h2 className="text-[15px] font-bold text-[var(--text-primary)] leading-snug group-hover:text-[var(--gold-dark)] transition-colors duration-300 line-clamp-1 mb-1">
          {hotel.name}
        </h2>
        <p className="text-xs text-[var(--text-muted)] font-medium flex items-center gap-1 mb-4">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-60">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          {hotel.locationCity}, {hotel.locationCountry}
        </p>

        {/* Services preview chips */}
        {services.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {services.map(s => (
              <span key={s.label} className="service-chip">
                <span>{s.icon}</span>{s.label}
              </span>
            ))}
          </div>
        )}

        {/* Price + CTA */}
        <div className="flex items-end justify-between pt-3.5 border-t border-[var(--border-soft)]">
          <div>
            <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest mb-0.5">{t("common.from")}</p>
            {hotel.minPricePerNight ? (
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-[var(--text-primary)]">${hotel.minPricePerNight.toLocaleString("es-CL")}</span>
                <span className="text-[10px] font-medium text-[var(--text-muted)]">{t("common.perNight")}</span>
              </div>
            ) : (
              <p className="text-sm font-medium text-[var(--text-muted)]">{t("common.consultPrice")}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <CompareButton hotel={{
              id: hotel.id, slug: hotel.slug, name: hotel.name,
              category: hotel.category, starRating: hotel.starRating,
              locationCity: hotel.locationCity,
              minPricePerNight: hotel.minPricePerNight ?? null,
              imageUrl: hotel.images?.[0]?.url,
            }} />
            <div className="w-9 h-9 rounded-full bg-[var(--text-primary)] flex items-center justify-center group-hover:bg-[var(--gold)] group-hover:shadow-[var(--shadow-gold)] group-hover:scale-110 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
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

/* ── ScrollProgress ───────────────────────────────────────── */
function ScrollProgress() {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const update = () => {
      const el = document.documentElement;
      const pct = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100;
      setWidth(Math.min(100, pct));
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return <div className="scroll-progress" style={{ width: `${width}%` }} />;
}

/* ── EmptyState ───────────────────────────────────────────── */
function EmptyState({ locale, t }: { locale: string; t: any }) {
  return (
    <div className="text-center py-28 bg-white rounded-3xl border border-[var(--border)] shadow-[var(--shadow-sm)] animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-[var(--surface-2)] flex items-center justify-center mx-auto mb-5 text-3xl">🔍</div>
      <h3 className="text-xl font-black text-[var(--text-primary)] mb-2">{t("hotels.results.emptyTitle")}</h3>
      <p className="text-[var(--text-muted)] text-sm max-w-xs mx-auto mb-8 leading-relaxed">{t("hotels.results.emptyDescription")}</p>
      <a
        href={`/${locale}/hotels`}
        className="btn-dark inline-flex items-center gap-2 text-[11px] px-7 py-3 rounded-2xl"
      >
        {t("hotels.results.viewAll")}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </a>
    </div>
  );
}
