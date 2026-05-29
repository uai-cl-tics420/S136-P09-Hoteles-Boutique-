"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const CAT_LABELS: Record<string, string> = {
  LUXURY: "Lujo", BOUTIQUE: "Boutique", ECO: "Eco",
  BEACH: "Playa", MOUNTAIN: "Montaña", CITY: "Ciudad",
};

type RankedHotel = {
  id: string; name: string; slug: string; category: string;
  starRating: number; locationCity: string;
  avgOverall: number; avgService: number; avgCleanliness: number; avgLocation: number;
  reviewCount: number;
};

function RankingTable({ title, data, sortKey }: { title: string; data: RankedHotel[]; sortKey: keyof RankedHotel }) {
  const sorted = [...data].sort((a, b) => Number(b[sortKey]) - Number(a[sortKey])).slice(0, 5);
  return (
    <div className="bg-white rounded-3xl border border-[var(--border)] p-8 shadow-[var(--shadow-xs)] relative overflow-hidden group hover:shadow-lg transition-all duration-500">
      <div className="absolute top-0 left-0 w-1 h-full bg-[var(--gold)] transform origin-top scale-y-0 group-hover:scale-y-100 transition-transform duration-500" />
      <h2 className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)] mb-6 flex items-center gap-3">
        {title}
      </h2>
      <div className="space-y-1">
        {sorted.map((h, i) => (
          <a key={h.id} href={`/es/hotels/${h.slug}`} className="flex items-center gap-4 hover:bg-[var(--surface-hover)] p-3 rounded-2xl transition-all">
            <span className={`text-2xl font-black w-8 text-center ${i === 0 ? "text-[var(--gold)]" : i === 1 ? "text-gray-400" : "text-[var(--border)]"}`}>
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[var(--text-primary)] text-sm truncate">{h.name}</p>
              <p className="text-xs font-medium text-[var(--text-muted)] mt-0.5">{h.locationCity} · {h.reviewCount} reseñas</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-black text-[var(--gold)]">{Number(h[sortKey]).toFixed(1)} <span className="text-xs">★</span></p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mt-0.5">{CAT_LABELS[h.category]}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

export default function ReviewsPage() {
  const [ranking, setRanking] = useState<RankedHotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHotel, setSelectedHotel] = useState("");
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"ranking" | "reviews">("ranking");
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "es";

  useEffect(() => {
    fetch("/api/reviews?ranking=true")
      .then((r) => r.json())
      .then((rv) => {
        setRanking(rv.ranking ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedHotel) return;
    setReviewsLoading(true);
    fetch(`/api/reviews?hotelId=${selectedHotel}`)
      .then((r) => r.json())
      .then((d) => { setReviews(d.reviews ?? []); setReviewsLoading(false); })
      .catch(() => setReviewsLoading(false));
  }, [selectedHotel]);

  const hotels = ranking.map((h) => ({ id: h.id, name: h.name }));

  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* Header Premium */}
      <header className="sticky top-0 z-50 glass border-b border-[var(--border-soft)] shadow-[var(--shadow-xs)]">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href={`/${locale}/hotels`} className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              ← Explorar hoteles
            </a>
            <span className="text-[var(--border)]">|</span>
            <span className="text-sm font-bold tracking-wide uppercase text-[var(--text-primary)]">La Guía de Excelencia</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-5 py-12">
        
        {/* Titulo principal (estilo editorial) */}
        <div className="text-center mb-12 animate-slide-up">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--gold)] mb-3">Selección Anual</p>
          <h1 className="text-4xl md:text-5xl font-black text-[var(--text-primary)] tracking-tight mb-4">Rankings & Reseñas</h1>
          <p className="text-sm font-medium text-[var(--text-muted)] max-w-xl mx-auto">
            Descubre las propiedades mejor valoradas por nuestra comunidad exclusiva de viajeros. La excelencia reconocida a través de experiencias reales.
          </p>
        </div>

        {/* Tabs Elegantes */}
        <div className="flex justify-center mb-12">
          <div className="flex gap-2 p-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-full shadow-[var(--shadow-xs)]">
            {(["ranking", "reviews"] as const).map((t) => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 ${activeTab === t ? "bg-[var(--text-primary)] text-white shadow-md" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>
                {{ ranking: "Clasificación Global", reviews: "Leer Reseñas" }[t]}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl border border-[var(--border)] p-8 animate-shimmer h-64" />
            ))}
          </div>
        ) : activeTab === "ranking" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 stagger-children">
            <RankingTable title="🏆 La Más Alta Distinción" data={ranking} sortKey="avgOverall" />
            <RankingTable title="💼 Excelencia en Servicio" data={ranking} sortKey="avgService" />
            <RankingTable title="✨ Estándares de Limpieza" data={ranking} sortKey="avgCleanliness" />
            <RankingTable title="📍 Ubicación Privilegiada" data={ranking} sortKey="avgLocation" />
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-8 animate-slide-up">
            
            {/* Selector de Hotel */}
            <div className="bg-white rounded-3xl border border-[var(--border)] p-8 shadow-[var(--shadow-xs)] relative z-10">
              <label className="block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4">Selecciona una propiedad</label>
              <div className="relative">
                <select
                  value={selectedHotel}
                  onChange={(e) => setSelectedHotel(e.target.value)}
                  className="w-full appearance-none bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--text-primary)] rounded-xl px-5 py-4 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] transition-all cursor-pointer"
                >
                  <option value="">— Colección Completa —</option>
                  {hotels.map((h) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-[var(--text-muted)]">
                  ▼
                </div>
              </div>
            </div>

            {reviewsLoading && (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-3xl border border-[var(--border)] p-8 animate-shimmer h-32" />
                ))}
              </div>
            )}

            {!reviewsLoading && selectedHotel && reviews.length === 0 && (
              <div className="text-center py-20 bg-white rounded-3xl border border-[var(--border)]">
                <span className="text-4xl mb-4 block opacity-50">✍️</span>
                <p className="text-sm font-bold text-[var(--text-primary)] mb-1">Aún no hay reseñas</p>
                <p className="text-xs text-[var(--text-muted)]">Sé el primero en compartir tu experiencia en esta propiedad.</p>
              </div>
            )}

            {!reviewsLoading && (
              <div className="space-y-6 stagger-children">
                {reviews.map((r: any) => (
                  <div key={r.id} className="bg-white rounded-3xl border border-[var(--border)] p-8 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-5 border-b border-[var(--border-soft)] pb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg text-[var(--gold)] tracking-[0.2em]">{"★".repeat(r.ratingOverall)}</span>
                        <span className="text-lg text-[var(--surface-hover)] tracking-[0.2em]">{"★".repeat(5 - r.ratingOverall)}</span>
                      </div>
                      <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
                        {new Date(r.createdAt).toLocaleDateString("es", { month: "long", year: "numeric" })}
                      </span>
                    </div>
                    
                    {r.comment && <p className="text-[15px] leading-relaxed text-[var(--text-primary)] mb-6 font-medium">"{r.comment}"</p>}
                    
                    <div className="grid grid-cols-3 gap-4 bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)]">
                      {[
                        { label: "Servicio", val: r.ratingService },
                        { label: "Limpieza", val: r.ratingCleanliness },
                        { label: "Ubicación", val: r.ratingLocation },
                      ].map(({ label, val }) => (
                        <div key={label} className="text-center">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">{label}</p>
                          <p className="text-sm font-black text-[var(--text-primary)]">{val}<span className="text-xs font-medium text-[var(--text-muted)]">/5</span></p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
