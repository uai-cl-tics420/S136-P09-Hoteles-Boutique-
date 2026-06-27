import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

interface Props { params: Promise<{ locale: string }> }

const COPY = {
  es: {
    badge:         "Plataforma Boutique · Latinoamérica",
    title1:        "Hoteles",
    title2:        "Boutique",
    description:   "Descubre experiencias únicas en los hoteles más exclusivos de Latinoamérica. Reservas inteligentes, asistente IA y colecciones curadas para el viajero moderno.",
    cta1:          "Explorar Hoteles",
    cta2:          "AI Concierge",
    scrollHint:    "Explorar",
    statLabels:    ["Hoteles", "Ciudades", "Países", "Reseñas", "Rating Prom", "Reservas"],
    techTitle:     "Arquitectura de clase mundial",
    techSubtitle:  "Tecnología que",
    techHighlight: " impulsa",
    techSuffix:    " la experiencia",
    features: [
      { icon: "🤖", title: "AI Concierge",       badge: "Gemini API",  desc: (h: number, r: number) => `Búsqueda en lenguaje natural con Gemini 1.5 Flash + motor NLP local de respaldo.` },
      { icon: "⚡", title: "Bun Runtime",         badge: "Bun 1.3",     desc: (h: number, r: number) => `Seeds de ${h} hoteles, ${r} reseñas y miles de imágenes en segundos.` },
      { icon: "🗄️", title: "Drizzle + Postgres",  badge: "Type-safe",   desc: (h: number, r: number) => `Schema tipado, índices optimizados, consultas relacionales con JOINs eficientes.` },
      { icon: "🌐", title: "Next.js 15 + i18n",   badge: "Next.js 15",  desc: (h: number, r: number) => `App Router, Server Components, streaming, internacionalización ES/EN completa.` },
    ],
    footerCourse: "Plataforma Full-Stack · TICS420 · UAI 2026",
  },
  en: {
    badge:         "Boutique Platform · Latin America",
    title1:        "Boutique",
    title2:        "Hotels",
    description:   "Discover unique experiences at the most exclusive hotels in Latin America. Smart bookings, AI assistant and curated collections for the modern traveler.",
    cta1:          "Explore Hotels",
    cta2:          "AI Concierge",
    scrollHint:    "Explore",
    statLabels:    ["Hotels", "Cities", "Countries", "Reviews", "Avg Rating", "Bookings"],
    techTitle:     "World-class architecture",
    techSubtitle:  "Technology that",
    techHighlight: " powers",
    techSuffix:    " the experience",
    features: [
      { icon: "🤖", title: "AI Concierge",       badge: "Gemini API",  desc: (h: number, r: number) => `Natural language search powered by Gemini 1.5 Flash + local NLP fallback engine.` },
      { icon: "⚡", title: "Bun Runtime",         badge: "Bun 1.3",     desc: (h: number, r: number) => `Seeded ${h} hotels, ${r} reviews and thousands of images in seconds.` },
      { icon: "🗄️", title: "Drizzle + Postgres",  badge: "Type-safe",   desc: (h: number, r: number) => `Typed schema, optimized indexes, relational queries with efficient JOINs.` },
      { icon: "🌐", title: "Next.js 15 + i18n",   badge: "Next.js 15",  desc: (h: number, r: number) => `App Router, Server Components, streaming, full ES/EN internationalization.` },
    ],
    footerCourse: "Full-Stack Platform · TICS420 · UAI 2026",
  },
} as const;

async function getStats() {
  try {
    const [hotels]    = await db.execute(sql`SELECT COUNT(*) as c FROM hotels WHERE active = true`);
    const [reviews]   = await db.execute(sql`SELECT COUNT(*) as c FROM reviews`);
    const [bookings]  = await db.execute(sql`SELECT COUNT(*) as c FROM bookings`);
    const [cities]    = await db.execute(sql`SELECT COUNT(DISTINCT location_city) as c FROM hotels`);
    const [countries] = await db.execute(sql`SELECT COUNT(DISTINCT location_country) as c FROM hotels`);
    const [avgRating] = await db.execute(sql`SELECT ROUND(AVG(rating_overall),1) as r FROM reviews`);
    return {
      hotels:    Number(hotels.c),
      reviews:   Number(reviews.c),
      bookings:  Number(bookings.c),
      cities:    Number(cities.c),
      countries: Number(countries.c),
      avgRating: String(avgRating.r ?? "4.3"),
    };
  } catch {
    return { hotels: 411, reviews: 1227, bookings: 0, cities: 30, countries: 8, avgRating: "4.3" };
  }
}

export default async function PublicPage({ params }: Props) {
  const { locale } = await params;
  const stats = await getStats();
  const c = COPY[locale as keyof typeof COPY] ?? COPY.es;

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col overflow-hidden">

      {/* ── Hero Section ────────────────────────────────────────── */}
      <section className="relative flex-1 flex items-center justify-center min-h-[92vh] overflow-hidden">

        {/* Animated gradient orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-15%] left-[-8%] w-[700px] h-[700px] rounded-full bg-gradient-to-br from-[var(--gold)]/12 to-purple-500/5 blur-[140px] animate-orb" />
          <div className="absolute bottom-[-10%] right-[-8%] w-[600px] h-[600px] rounded-full bg-gradient-to-tl from-purple-600/8 to-[var(--gold)]/6 blur-[120px] animate-orb" style={{ animationDelay: "2.5s" }} />
          <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] rounded-full bg-[var(--gold)]/4 blur-[100px] animate-orb" style={{ animationDelay: "4s" }} />
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[15%] left-[12%] w-2 h-2 rounded-full bg-[var(--gold)]/30 animate-particle" />
          <div className="absolute top-[25%] right-[18%] w-1.5 h-1.5 rounded-full bg-[var(--gold)]/20 animate-particle-d1" />
          <div className="absolute top-[60%] left-[8%] w-1 h-1 rounded-full bg-purple-400/25 animate-particle-d2" />
          <div className="absolute top-[70%] right-[12%] w-2.5 h-2.5 rounded-full bg-[var(--gold)]/15 animate-particle-d3" />
          <div className="absolute top-[45%] left-[75%] w-1.5 h-1.5 rounded-full bg-[var(--gold-shine)]/20 animate-particle" />
          <div className="absolute top-[35%] left-[30%] w-1 h-1 rounded-full bg-purple-300/15 animate-particle-d2" />
        </div>

        {/* Decorative rings */}
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-[500px] h-[500px] rounded-full border border-[var(--gold)]/5 animate-spin-slow" />
        </div>
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-[700px] h-[700px] rounded-full border border-[var(--border)]/30 animate-spin-slow" style={{ animationDirection: "reverse", animationDuration: "14s" }} />
        </div>

        {/* Main content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 bg-[var(--gold-lighter)] border border-[var(--gold)]/25 text-[var(--gold-dark)] text-[10px] font-black uppercase tracking-[0.25em] px-5 py-2.5 rounded-full mb-10 animate-text-reveal animate-glow-ring">
            <span className="relative flex h-2 w-2">
              <span className="ping-gold absolute inline-flex h-full w-full rounded-full bg-[var(--gold)] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--gold)]" />
            </span>
            {c.badge}
          </div>

          {/* Headline */}
          <h1 className="text-6xl sm:text-8xl md:text-[9rem] font-black tracking-tighter mb-4 leading-[0.85]">
            <span className="block animate-text-reveal text-[var(--text-primary)]">{c.title1}</span>
            <span className="block animate-text-reveal-d1">
              <span className="text-gradient-gold">{c.title2}</span>
            </span>
          </h1>

          {/* Animated underline */}
          <div className="relative mx-auto mb-8 h-[2px] max-w-[200px] bg-[var(--border)]">
            <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-[var(--gold-shine)] via-[var(--gold)] to-[var(--gold-dark)] animate-line-draw" />
          </div>

          {/* Description */}
          <p className="text-lg sm:text-xl text-[var(--text-muted)] font-light max-w-2xl mx-auto mb-14 animate-text-reveal-d2 leading-relaxed">
            {c.description}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 animate-text-reveal-d3">
            <a href={`/${locale}/hotels`}
              className="btn-gold text-[12px] font-black tracking-[0.14em] uppercase px-12 py-5 rounded-2xl shadow-[var(--shadow-gold)] hover:scale-105 transition-all duration-300 inline-flex items-center gap-3 group">
              <span className="text-base group-hover:rotate-90 transition-transform duration-500">✦</span>
              {c.cta1}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
            <a href={`/${locale}/hotels`}
              className="text-[12px] font-bold tracking-[0.1em] uppercase px-10 py-5 rounded-2xl border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:border-[var(--gold)] hover:text-[var(--gold-dark)] hover:shadow-[var(--shadow-md)] transition-all duration-300 inline-flex items-center gap-2.5 group">
              <span className="group-hover:animate-bounce">🤖</span> {c.cta2}
            </a>
          </div>

          {/* Live Stats */}
          <div className="stats-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 max-w-4xl mx-auto">
            {[
              { value: `${stats.hotels}+`,   icon: "🏨" },
              { value: `${stats.cities}`,    icon: "🌆" },
              { value: `${stats.countries}`, icon: "🌎" },
              { value: `${stats.reviews}+`,  icon: "⭐" },
              { value: stats.avgRating,      icon: "✦"  },
              { value: `${stats.bookings}+`, icon: "🛎️" },
            ].map((s, i) => (
              <div key={i} className="group bg-white/80 backdrop-blur-sm border border-[var(--border)] rounded-2xl p-4 shadow-[var(--shadow-xs)] hover:border-[var(--gold)] hover:shadow-[var(--shadow-md)] hover:-translate-y-1 transition-all duration-300 cursor-default">
                <p className="text-xl mb-1 group-hover:scale-110 transition-transform duration-300">{s.icon}</p>
                <p className="text-2xl font-black text-[var(--text-primary)] group-hover:text-[var(--gold-dark)] transition-colors duration-300">{s.value}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{c.statLabels[i]}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 animate-bounce opacity-40">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{c.scrollHint}</p>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)]">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </div>
      </section>

      {/* ── Infinite Marquee Ticker ──────────────────────────────── */}
      <div className="border-y border-[var(--border)] bg-[var(--surface-2)] py-4 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap inline-flex items-center gap-8">
          {[...Array(2)].map((_, rep) => (
            <span key={rep} className="inline-flex items-center gap-8">
              {["Santiago", "Buenos Aires", "Lima", "Cusco", "Medellín", "Bariloche", "Valparaíso", "São Paulo", "Bogotá", "Tulum", "Mendoza", "Pucón"].map(city => (
                <span key={`${city}-${rep}`} className="inline-flex items-center gap-2 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                  <span className="w-1 h-1 rounded-full bg-[var(--gold)]" />
                  {city}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ── Feature Strip ─────────────────────────────────────────── */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--gold)] mb-3">
              {c.techTitle}
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] tracking-tight">
              {c.techSubtitle}
              <span className="text-gradient-gold">{c.techHighlight}</span>
              {c.techSuffix}
            </h2>
          </div>
          <div className="feature-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {c.features.map(f => (
              <div key={f.title} className="group relative p-7 rounded-3xl border border-[var(--border)] hover:border-[var(--gold)] hover:shadow-[var(--shadow-lg)] transition-all duration-400 hover:-translate-y-2 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-[var(--surface-2)] rounded-2xl flex items-center justify-center text-2xl mb-5 group-hover:bg-[var(--gold-lighter)] group-hover:scale-110 transition-all duration-400 border border-[var(--border)] group-hover:border-[var(--gold)]/30">
                    {f.icon}
                  </div>
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-[15px] font-bold text-[var(--text-primary)] group-hover:text-[var(--gold-dark)] transition-colors">{f.title}</p>
                    <span className="text-[9px] font-black uppercase tracking-widest bg-[var(--gold-lighter)] text-[var(--gold-dark)] border border-[var(--gold)]/20 px-2 py-0.5 rounded-full ml-2 shrink-0">{f.badge}</span>
                  </div>
                  <p className="text-[13px] text-[var(--text-muted)] leading-relaxed font-medium">
                    {f.desc(stats.hotels, stats.reviews)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--border)] aurora-bg text-white noise relative">
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-xl font-black tracking-tight mb-1">
              Hoteles<span className="text-[var(--gold-shine)]">Boutique</span>
            </p>
            <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest">
              {c.footerCourse}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {[
              { label: "Bun 1.3",     color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
              { label: "Next.js 15",  color: "bg-white/10 text-white/70 border-white/20" },
              { label: "Drizzle ORM", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
              { label: "PostgreSQL",  color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
              { label: "Gemini AI",   color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
              { label: "TypeScript",  color: "bg-sky-500/20 text-sky-300 border-sky-500/30" },
            ].map(t => (
              <span key={t.label} className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border hover:scale-105 transition-transform duration-200 cursor-default ${t.color}`}>
                {t.label}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
