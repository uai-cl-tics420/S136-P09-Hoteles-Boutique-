import { db } from "@/db";
import { sql } from "drizzle-orm";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface Props { params: Promise<{ locale: string }> }

async function getStats() {
  try {
    const [hotels] = await db.execute(sql`SELECT COUNT(*) as c FROM hotels WHERE active = true`);
    const [reviews] = await db.execute(sql`SELECT COUNT(*) as c FROM reviews`);
    const [bookings] = await db.execute(sql`SELECT COUNT(*) as c FROM bookings`);
    const [cities] = await db.execute(sql`SELECT COUNT(DISTINCT location_city) as c FROM hotels`);
    const [countries] = await db.execute(sql`SELECT COUNT(DISTINCT location_country) as c FROM hotels`);
    const [avgRating] = await db.execute(sql`SELECT ROUND(AVG(rating_overall),1) as r FROM reviews`);
    return {
      hotels: Number(hotels.c),
      reviews: Number(reviews.c),
      bookings: Number(bookings.c),
      cities: Number(cities.c),
      countries: Number(countries.c),
      avgRating: String(avgRating.r ?? "4.3"),
    };
  } catch { return { hotels: 411, reviews: 1227, bookings: 0, cities: 30, countries: 8, avgRating: "4.3" }; }
}

export default async function PublicPage({ params }: Props) {
  const { locale } = await params;
  const stats = await getStats();

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative flex-1 flex items-center justify-center overflow-hidden min-h-[90vh]">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-[var(--gold)]/8 blur-[120px]" />
          <div className="absolute bottom-[-5%] right-[-5%] w-[500px] h-[500px] rounded-full bg-purple-500/6 blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[var(--gold-lighter)] border border-[var(--gold)]/25 text-[var(--gold-dark)] text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full mb-8 animate-fade-in">
            <span className="w-1.5 h-1.5 bg-[var(--gold)] rounded-full animate-pulse" />
            Plataforma Boutique · Latinoamérica
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight mb-6 animate-slide-up leading-[0.9]">
            <span className="text-[var(--text-primary)]">Hoteles</span>
            <br />
            <span className="text-gradient-gold">Boutique</span>
          </h1>

          <p className="text-lg sm:text-xl text-[var(--text-muted)] font-light max-w-2xl mx-auto mb-12 animate-slide-up-delay leading-relaxed">
            Descubre experiencias únicas en los hoteles más exclusivos de Latinoamérica.
            Reservas inteligentes, asistente IA y colecciones curadas para el viajero moderno.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 animate-fade-in">
            <a href={`/${locale}/hotels`}
              className="btn-gold text-[12px] font-black tracking-[0.12em] uppercase px-10 py-4 rounded-2xl shadow-[var(--shadow-gold)] hover:scale-105 transition-transform duration-300 inline-flex items-center gap-2.5">
              <span className="text-base">✦</span>
              Explorar Hoteles
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
            <a href={`/${locale}/hotels`}
              className="text-[12px] font-bold tracking-[0.1em] uppercase px-8 py-4 rounded-2xl border border-[var(--border)] bg-white text-[var(--text-secondary)] hover:border-[var(--gold)] hover:text-[var(--gold-dark)] transition-all duration-200 inline-flex items-center gap-2">
              <span>🤖</span> AI Concierge
            </a>
          </div>

          {/* ── Live Stats ───────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 max-w-4xl mx-auto animate-fade-in">
            {[
              { value: `${stats.hotels}+`,    label: "Hoteles",    icon: "🏨" },
              { value: `${stats.cities}`,     label: "Ciudades",   icon: "🌆" },
              { value: `${stats.countries}`,  label: "Países",     icon: "🌎" },
              { value: `${stats.reviews}+`,   label: "Reseñas",    icon: "⭐" },
              { value: stats.avgRating,       label: "Rating Prom",icon: "✦"  },
              { value: "100%",                label: "Boutique",   icon: "💎" },
            ].map(s => (
              <div key={s.label} className="bg-white border border-[var(--border)] rounded-2xl p-4 shadow-[var(--shadow-xs)] hover:border-[var(--gold)] hover:shadow-[var(--shadow-md)] transition-all duration-300 group">
                <p className="text-xl mb-1">{s.icon}</p>
                <p className="text-2xl font-black text-[var(--text-primary)] group-hover:text-[var(--gold-dark)] transition-colors">{s.value}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 animate-bounce opacity-40">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Explorar</p>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)]">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </div>
      </section>

      {/* ── Feature Strip ────────────────────────────────────── */}
      <section className="border-t border-[var(--border)] bg-white">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--text-muted)] text-center mb-12">
            Tecnología de clase mundial
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: "🤖",
                title: "AI Concierge",
                desc: "Búsqueda en lenguaje natural con Gemini 1.5 Flash + motor NLP local de respaldo.",
                badge: "Gemini API",
              },
              {
                icon: "⚡",
                title: "Bun Runtime",
                desc: "Seeds de 411 hoteles, 1.227 reseñas y 1.233 imágenes ejecutadas en segundos con Bun.",
                badge: "Bun 1.3",
              },
              {
                icon: "🗄️",
                title: "Drizzle ORM + Postgres",
                desc: "Schema tipado, índices optimizados, consultas relacionales con JOINs eficientes.",
                badge: "Type-safe",
              },
              {
                icon: "🌐",
                title: "Next.js 15 + i18n",
                desc: "App Router, Server Components, streaming, internacionalización ES/EN completa.",
                badge: "Next.js 15",
              },
            ].map(f => (
              <div key={f.title} className="group p-6 rounded-3xl border border-[var(--border)] hover:border-[var(--gold)] hover:shadow-[var(--shadow-md)] transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 bg-[var(--surface-2)] rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:bg-[var(--gold-lighter)] transition-colors border border-[var(--border)] group-hover:border-[var(--gold)]/30">
                  {f.icon}
                </div>
                <div className="flex items-start justify-between mb-2">
                  <p className="text-[15px] font-bold text-[var(--text-primary)] group-hover:text-[var(--gold-dark)] transition-colors">{f.title}</p>
                  <span className="text-[9px] font-black uppercase tracking-widest bg-[var(--gold-lighter)] text-[var(--gold-dark)] border border-[var(--gold)]/20 px-2 py-0.5 rounded-full ml-2 shrink-0">{f.badge}</span>
                </div>
                <p className="text-[13px] text-[var(--text-muted)] leading-relaxed font-medium">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech Stack Footer ─────────────────────────────────── */}
      <footer className="border-t border-[var(--border)] bg-[var(--text-primary)] text-white">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-[15px] font-black tracking-tight mb-1">
              Hoteles<span className="text-[var(--gold)]">Boutique</span>
            </p>
            <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest">
              Plataforma Full-Stack · TICS420 · UAI 2026
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {[
              { label: "Bun 1.3", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
              { label: "Next.js 15", color: "bg-white/10 text-white/70 border-white/20" },
              { label: "Drizzle ORM", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
              { label: "PostgreSQL", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
              { label: "Gemini AI", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
              { label: "TypeScript", color: "bg-sky-500/20 text-sky-300 border-sky-500/30" },
            ].map(t => (
              <span key={t.label} className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${t.color}`}>
                {t.label}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
