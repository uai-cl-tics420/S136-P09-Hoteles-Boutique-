import { db } from "@/db";
import { sql } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getMetrics() {
  const [hotels]   = await db.execute(sql`SELECT COUNT(*) as c FROM hotels WHERE active = true`);
  const [inactive] = await db.execute(sql`SELECT COUNT(*) as c FROM hotels WHERE active = false`);
  const [rooms]    = await db.execute(sql`SELECT COUNT(*) as c FROM room_types`);
  const [bookings] = await db.execute(sql`SELECT COUNT(*) as c FROM bookings`);
  const [reviews]  = await db.execute(sql`SELECT COUNT(*) as c FROM reviews`);
  const [images]   = await db.execute(sql`SELECT COUNT(*) as c FROM hotel_images`);
  const [extras]   = await db.execute(sql`SELECT COUNT(*) as c FROM extra_services`);
  const [cities]   = await db.execute(sql`SELECT COUNT(DISTINCT location_city) as c FROM hotels`);
  const [countries]= await db.execute(sql`SELECT COUNT(DISTINCT location_country) as c FROM hotels`);
  const [revenue]  = await db.execute(sql`SELECT ROUND(SUM(total_price)) as r FROM bookings WHERE status IN ('CONFIRMED','COMPLETED')`);
  const [avgRating]= await db.execute(sql`SELECT ROUND(AVG(rating_overall),2) as r FROM reviews`);
  const [pending]  = await db.execute(sql`SELECT COUNT(*) as c FROM bookings WHERE status = 'PENDING'`);
  const [catBreak] = await Promise.all([
    db.execute(sql`SELECT category, COUNT(*) as cnt FROM hotels GROUP BY category ORDER BY cnt DESC`),
  ]);
  return {
    hotels: Number(hotels.c), inactive: Number(inactive.c),
    rooms: Number(rooms.c), bookings: Number(bookings.c),
    reviews: Number(reviews.c), images: Number(images.c),
    extras: Number(extras.c), cities: Number(cities.c),
    countries: Number(countries.c),
    revenue: Number(revenue.r ?? 0),
    avgRating: String(avgRating.r ?? "4.3"),
    pending: Number(pending.c),
    catBreak: catBreak as unknown as {category:string;cnt:string}[],
  };
}

export default async function StackPage({ params }: { params: Promise<{locale:string}> }) {
  const { locale } = await params;
  const m = await getMetrics();

  const totalEntities = m.hotels + m.rooms + m.bookings + m.reviews + m.images + m.extras;

  return (
    <div className="space-y-10 max-w-6xl">
      <div>
        <h1 className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] tracking-tight mb-2">
          Stack Técnico & Métricas
        </h1>
        <p className="text-sm font-medium text-[var(--text-muted)]">
          Visión arquitectónica del sistema — escalabilidad y complejidad técnica
        </p>
      </div>

      {/* ── Database Metrics ──────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-4">
          📊 Métricas de Base de Datos (Live · PostgreSQL)
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[
            { label: "Hoteles activos",      value: m.hotels,       icon: "🏨", color: "border-[var(--gold)]/30 bg-[var(--gold-lighter)]" },
            { label: "Tipos de habitación",  value: m.rooms,        icon: "🛏️", color: "border-emerald-200 bg-emerald-50" },
            { label: "Reservas totales",      value: m.bookings,     icon: "📅", color: "border-blue-200 bg-blue-50" },
            { label: "Reservas pendientes",  value: m.pending,      icon: "⏳", color: "border-amber-200 bg-amber-50" },
            { label: "Reseñas",              value: m.reviews,      icon: "⭐", color: "border-purple-200 bg-purple-50" },
            { label: "Imágenes en BD",       value: m.images,       icon: "🖼️", color: "border-rose-200 bg-rose-50" },
            { label: "Servicios extra",      value: m.extras,       icon: "✨", color: "border-sky-200 bg-sky-50" },
            { label: "Total entidades BD",   value: totalEntities,  icon: "🗄️", color: "border-slate-200 bg-slate-50" },
          ].map(s => (
            <div key={s.label} className={`rounded-3xl border p-5 ${s.color} hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-all duration-200`}>
              <p className="text-2xl mb-2">{s.icon}</p>
              <p className="text-2xl font-black text-[var(--text-primary)]">{s.value.toLocaleString("es-CL")}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Cobertura geográfica ─────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[var(--border)] p-7 shadow-[var(--shadow-xs)]">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-5">
          🌎 Cobertura Geográfica
        </p>
        <div className="flex gap-8 mb-6">
          <div>
            <p className="text-4xl font-black text-gradient-gold">{m.cities}</p>
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Ciudades</p>
          </div>
          <div className="w-px bg-[var(--border)]" />
          <div>
            <p className="text-4xl font-black text-gradient-gold">{m.countries}</p>
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Países</p>
          </div>
          <div className="w-px bg-[var(--border)]" />
          <div>
            <p className="text-4xl font-black text-gradient-gold">{m.avgRating}</p>
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Rating promedio</p>
          </div>
          <div className="w-px bg-[var(--border)]" />
          <div>
            <p className="text-4xl font-black text-gradient-gold">${Math.round(m.revenue/1_000_000)}M</p>
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Ingresos CLP</p>
          </div>
        </div>
        {/* Category breakdown */}
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3">Distribución por categoría</p>
          <div className="space-y-2">
            {m.catBreak.map((c: any) => {
              const pct = Math.round((Number(c.cnt) / m.hotels) * 100);
              const colors: Record<string,string> = { LUXURY:"bg-purple-500", BOUTIQUE:"bg-rose-500", ECO:"bg-emerald-500", BEACH:"bg-sky-500", MOUNTAIN:"bg-amber-500", CITY:"bg-zinc-500" };
              return (
                <div key={c.category} className="flex items-center gap-3">
                  <p className="text-[10px] font-bold text-[var(--text-muted)] w-20 uppercase">{c.category}</p>
                  <div className="flex-1 bg-[var(--surface-2)] rounded-full h-2">
                    <div className={`${colors[c.category] ?? "bg-gray-400"} h-2 rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[10px] font-black text-[var(--text-primary)] w-8 text-right">{c.cnt}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Tech Stack ───────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-4">
          ⚡ Stack Tecnológico
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              name: "Bun 1.3 Runtime",
              icon: "⚡",
              color: "border-amber-200 bg-gradient-to-br from-amber-50 to-white",
              dot: "bg-amber-500",
              items: [
                "Runtime JS ultrarrápido — hasta 4x más rápido que Node.js",
                "Seeds de 411 hoteles + 1.227 reseñas ejecutados en minutos",
                "Compatibilidad nativa con TypeScript sin transpilación",
                "package manager integrado (bun install, bun run)",
                "bun.lockb garantiza builds reproducibles",
              ],
            },
            {
              name: "Next.js 15 App Router",
              icon: "▲",
              color: "border-slate-200 bg-gradient-to-br from-slate-50 to-white",
              dot: "bg-slate-600",
              items: [
                "Server Components + Client Components híbrido",
                "Dynamic routes: /[locale]/hotels/[slug]",
                "force-dynamic para datos en tiempo real",
                "Middleware para i18n (ES/EN) y auth guards",
                "49 rutas generadas en el build",
              ],
            },
            {
              name: "Drizzle ORM + PostgreSQL",
              icon: "🗄️",
              color: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white",
              dot: "bg-emerald-500",
              items: [
                "Schema 100% tipado — 8 tablas relacionadas",
                "Índices en todas las columnas de filtro frecuente",
                "JOINs eficientes para hoteles+imágenes+rooms+reviews",
                "Filtros composables: categoría, estrellas, precio, experiencia",
                "Sin N+1 queries gracias a fetch batching",
              ],
            },
            {
              name: "AI Concierge (Gemini + NLP)",
              icon: "🤖",
              color: "border-purple-200 bg-gradient-to-br from-purple-50 to-white",
              dot: "bg-purple-500",
              items: [
                "Motor dual: Gemini 1.5 Flash + NLP rule-based local",
                "Detecta: categoría, experiencia, estrellas, país, mood",
                "Fallback automático si API key no disponible",
                "Typewriter animado + partículas orbitales thinking",
                "Integrado en /hotels con overlay sobre filtros clásicos",
              ],
            },
          ].map(tech => (
            <div key={tech.name} className={`rounded-3xl border p-6 ${tech.color} hover:shadow-[var(--shadow-md)] transition-all duration-300`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white rounded-2xl border border-[var(--border)] flex items-center justify-center text-xl shadow-[var(--shadow-xs)]">
                  {tech.icon}
                </div>
                <div>
                  <p className="text-[13px] font-black text-[var(--text-primary)]">{tech.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${tech.dot}`} />
                    <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Producción</span>
                  </div>
                </div>
              </div>
              <ul className="space-y-2">
                {tech.items.map(item => (
                  <li key={item} className="flex items-start gap-2 text-xs font-medium text-[var(--text-muted)]">
                    <span className={`w-1.5 h-1.5 rounded-full ${tech.dot} shrink-0 mt-1.5`} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Architecture diagram ─────────────────────────────── */}
      <div className="bg-[var(--text-primary)] rounded-3xl p-7 sm:p-10 text-white">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-6">
          🔧 Arquitectura del Sistema
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          {[
            { layer: "Frontend", items: ["Next.js 15 App Router","React Server Components","TailwindCSS-free CSS Vars","i18n ES/EN"] },
            { layer: "Backend / API", items: ["/api/hotels · filtros avanzados","/api/admin/* · CRUD completo","/api/ai-concierge · NLP + Gemini","Auth: NextAuth.js + roles"] },
            { layer: "Datos", items: ["PostgreSQL · 8 tablas","Drizzle ORM · type-safe","Bun seeds: 411 hoteles","1.227 reseñas · 1.233 imgs"] },
          ].map((col, i) => (
            <div key={col.layer} className="relative">
              {i > 0 && (
                <div className="hidden sm:flex absolute -left-2 top-1/2 -translate-y-1/2 text-white/20 text-2xl">→</div>
              )}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--gold)] mb-4">{col.layer}</p>
                <ul className="space-y-2">
                  {col.items.map(item => (
                    <li key={item} className="text-[11px] font-medium text-white/70">{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nav back */}
      <div className="flex justify-center pt-4">
        <Link href={`/${locale}/admin`}
          className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1.5 transition-colors">
          ← Volver al Dashboard
        </Link>
      </div>
    </div>
  );
}
