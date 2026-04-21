"use client";
import { useState, useEffect } from "react";

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
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <h2 className="font-semibold text-gray-900 mb-4">{title}</h2>
      <div className="space-y-3">
        {sorted.map((h, i) => (
          <a key={h.id} href={`/es/hotels/${h.slug}`} className="flex items-center gap-3 hover:bg-gray-50 -mx-2 px-2 py-2 rounded-xl transition-colors">
            <span className={`text-lg font-bold min-w-[28px] ${i === 0 ? "text-amber-500" : i === 1 ? "text-gray-400" : "text-gray-300"}`}>
              #{i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm truncate">{h.name}</p>
              <p className="text-xs text-gray-400">{h.locationCity} · {h.reviewCount} reseñas</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-semibold text-amber-500">{Number(h[sortKey]).toFixed(1)} ★</p>
              <p className="text-xs text-gray-400">{CAT_LABELS[h.category]}</p>
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

  useEffect(() => {
    // FIX: Una sola petición en vez de dos (/api/reviews?ranking=true ya incluye todo)
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

  // Derivar lista de hoteles del ranking (ya los tenemos, sin fetch extra)
  const hotels = ranking.map((h) => ({ id: h.id, name: h.name }));

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <a href="/es/hotels" className="text-sm text-gray-400 hover:text-gray-900">← Hoteles</a>
          <span className="text-gray-200">/</span>
          <span className="text-sm font-medium text-gray-900">Rankings y Reseñas</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl max-w-xs mb-8">
          {(["ranking", "reviews"] as const).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
              {{ ranking: "Rankings", reviews: "Reseñas" }[t]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse h-48" />
            ))}
          </div>
        ) : activeTab === "ranking" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <RankingTable title="🏆 Mejor calificación general" data={ranking} sortKey="avgOverall" />
            <RankingTable title="💼 Mejor atención al cliente" data={ranking} sortKey="avgService" />
            <RankingTable title="✨ Mejor limpieza" data={ranking} sortKey="avgCleanliness" />
            <RankingTable title="📍 Mejor ubicación" data={ranking} sortKey="avgLocation" />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Selecciona un hotel</label>
              <select
                value={selectedHotel}
                onChange={(e) => setSelectedHotel(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="">— Elige un hotel —</option>
                {hotels.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>

            {reviewsLoading && (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse h-24" />
                ))}
              </div>
            )}

            {!reviewsLoading && selectedHotel && reviews.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">Este hotel aún no tiene reseñas</p>
            )}

            {!reviewsLoading && reviews.map((r: any) => (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-amber-400">{"★".repeat(r.ratingOverall)}</span>
                  <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString("es", { month: "long", year: "numeric" })}</span>
                </div>
                {r.comment && <p className="text-sm text-gray-600 mb-3">{r.comment}</p>}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Atención", val: r.ratingService },
                    { label: "Limpieza", val: r.ratingCleanliness },
                    { label: "Ubicación", val: r.ratingLocation },
                  ].map(({ label, val }) => (
                    <div key={label} className="text-center bg-gray-50 rounded-lg p-2">
                      <p className="text-xs text-gray-400">{label}</p>
                      <p className="text-sm font-medium text-gray-900">{val}/5</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
