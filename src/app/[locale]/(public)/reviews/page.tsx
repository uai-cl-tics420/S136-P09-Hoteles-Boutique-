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
  const [hotels, setHotels] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"ranking" | "reviews">("ranking");

  useEffect(() => {
    Promise.all([
      fetch("/api/reviews?ranking=true").then((r) => r.json()),
      fetch("/api/hotels?limit=50").then((r) => r.json()),
    ]).then(([rv, ht]) => {
      setRanking(rv.ranking ?? []);
      setHotels(ht.hotels ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedHotel) { setReviews([]); return; }
    setReviewsLoading(true);
    fetch(`/api/reviews?hotelId=${selectedHotel}`)
      .then((r) => r.json())
      .then((d) => { setReviews(d.reviews ?? []); setReviewsLoading(false); })
      .catch(() => setReviewsLoading(false));
  }, [selectedHotel]);

  const withReviews = ranking.filter((h) => h.reviewCount > 0);

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/es/hotels" className="text-sm text-gray-400 hover:text-gray-900">← Hoteles</a>
            <span className="text-sm font-semibold text-gray-900">Reseñas y ranking</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl max-w-xs mb-8">
          {(["ranking", "reviews"] as const).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
              {{ ranking: "Ranking", reviews: "Reseñas" }[t]}
            </button>
          ))}
        </div>

        {activeTab === "ranking" && (
          <>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-48 border border-gray-100 animate-pulse" />)}
              </div>
            ) : withReviews.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-sm">No hay reseñas aún en ningún hotel</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <RankingTable title="🏆 Mejor experiencia general" data={withReviews} sortKey="avgOverall" />
                <RankingTable title="🤝 Mejor atención al cliente" data={withReviews} sortKey="avgService" />
                <RankingTable title="✨ Mayor limpieza" data={withReviews} sortKey="avgCleanliness" />
                <RankingTable title="📍 Mejor ubicación" data={withReviews} sortKey="avgLocation" />
              </div>
            )}
          </>
        )}

        {activeTab === "reviews" && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <label className="block text-xs font-medium text-gray-500 mb-2">Filtrar por hotel</label>
              <select
                value={selectedHotel}
                onChange={(e) => setSelectedHotel(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="">Todos los hoteles</option>
                {hotels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>

            {reviewsLoading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-28 border border-gray-100 animate-pulse" />)}</div>
            ) : !selectedHotel ? (
              <div className="text-center py-12 text-gray-400 text-sm">Selecciona un hotel para ver sus reseñas</div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">Este hotel aún no tiene reseñas</div>
            ) : (
              <div className="space-y-4">
                {reviews.map((r: any) => (
                  <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                          {r.guestId?.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Huésped verificado</p>
                          <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-amber-400">{"★".repeat(r.ratingOverall)}<span className="text-gray-200">{"★".repeat(5 - r.ratingOverall)}</span></p>
                      </div>
                    </div>
                    {r.comment && <p className="text-sm text-gray-600 leading-relaxed mb-3">{r.comment}</p>}
                    <div className="grid grid-cols-3 gap-2">
                      {[["Atención", r.ratingService], ["Limpieza", r.ratingCleanliness], ["Ubicación", r.ratingLocation]].map(([l, v]) => (
                        <div key={l as string} className="text-center bg-gray-50 rounded-lg p-2">
                          <p className="text-xs text-gray-400">{l}</p>
                          <p className="text-sm font-semibold text-gray-900">{v}/5</p>
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