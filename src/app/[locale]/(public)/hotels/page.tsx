
"use client";
import { useState, useEffect, useCallback } from "react";
import type { Hotel } from "@/types/domain";

type EnrichedHotel = Hotel & {
  avgRating: number | null;
  avgService: number | null;
  minPricePerNight: number | null;
  roomTypes: any[];
};

const CAT_LABELS: Record<string, string> = {
  LUXURY: "Lujo", BOUTIQUE: "Boutique", ECO: "Eco",
  BEACH: "Playa", MOUNTAIN: "Montaña", CITY: "Ciudad",
};

const CAT_COLORS: Record<string, string> = {
  LUXURY: "bg-purple-50 text-purple-700 border-purple-200",
  BOUTIQUE: "bg-pink-50 text-pink-700 border-pink-200",
  ECO: "bg-green-50 text-green-700 border-green-200",
  BEACH: "bg-blue-50 text-blue-700 border-blue-200",
  MOUNTAIN: "bg-amber-50 text-amber-700 border-amber-200",
  CITY: "bg-gray-100 text-gray-600 border-gray-200",
};

function Stars({ n, size = "sm" }: { n: number; size?: "sm" | "xs" }) {
  const cls = size === "xs" ? "text-xs" : "text-sm";
  return (
    <span className={`${cls} text-amber-400`}>
      {"★".repeat(Math.round(n))}
      <span className="text-gray-200">{"★".repeat(5 - Math.round(n))}</span>
    </span>
  );
}

export default function HotelsPage() {
  const [hotels, setHotels] = useState<EnrichedHotel[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minStars, setMinStars] = useState("");
  const [loading, setLoading] = useState(true);
  const [compareSet, setCompareSet] = useState<Set<string>>(new Set());
  const [showCompare, setShowCompare] = useState(false);

  const fetchHotels = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("city", search);
    if (category) params.set("category", category);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (minStars) params.set("minStars", minStars);
    const res = await fetch(`/api/hotels?${params}`);
    const data = await res.json();
    setHotels(data.hotels ?? []);
    setLoading(false);
  }, [search, category, maxPrice, minStars]);

  useEffect(() => { fetchHotels(); }, []);

  function toggleCompare(id: string) {
    setCompareSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); }
      else if (next.size < 3) { next.add(id); }
      return next;
    });
  }

  const compareHotels = hotels.filter((h) => compareSet.has(h.id));

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/es/hotels" className="text-lg font-semibold text-gray-900">Hoteles Boutique</a>
          <div className="flex gap-4">
            <a href="/es/bookings" className="text-sm text-gray-500 hover:text-gray-900">Mis reservas</a>
            <a href="/es/auth/login" className="text-sm text-gray-500 hover:text-gray-900">Cuenta</a>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero search */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Encuentra tu hotel ideal</h1>
          <p className="text-gray-400 mb-6">Experiencias exclusivas y personalizadas</p>
          <div className="flex gap-2 max-w-xl mx-auto">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchHotels()}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="Ciudad o nombre del hotel..."
            />
            <button
              onClick={fetchHotels}
              className="bg-gray-900 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Buscar
            </button>
          </div>
        </div>

        {/* Filters row */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="">Todas</option>
                {Object.entries(CAT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Precio máximo/noche</label>
              <select
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="">Sin límite</option>
                <option value="100">Hasta $100</option>
                <option value="200">Hasta $200</option>
                <option value="350">Hasta $350</option>
                <option value="500">Hasta $500</option>
              </select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Estrellas mínimas</label>
              <select
                value={minStars}
                onChange={(e) => setMinStars(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="">Cualquiera</option>
                <option value="3">3+ estrellas</option>
                <option value="4">4+ estrellas</option>
                <option value="5">5 estrellas</option>
              </select>
            </div>
            <button
              onClick={fetchHotels}
              className="bg-gray-900 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Aplicar filtros
            </button>
            {(category || maxPrice || minStars) && (
              <button
                onClick={() => { setCategory(""); setMaxPrice(""); setMinStars(""); setTimeout(fetchHotels, 0); }}
                className="text-sm text-gray-400 hover:text-gray-700 px-2 py-2"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Compare bar */}
        {compareSet.size > 0 && (
          <div className="bg-gray-900 text-white rounded-2xl p-4 mb-6 flex items-center justify-between">
            <span className="text-sm">
              {compareSet.size} hotel{compareSet.size > 1 ? "es" : ""} seleccionado{compareSet.size > 1 ? "s" : ""} para comparar
              {compareSet.size < 2 && <span className="text-gray-400 ml-2">(selecciona al menos 2)</span>}
            </span>
            <div className="flex gap-2">
              {compareSet.size >= 2 && (
                <button
                  onClick={() => setShowCompare(true)}
                  className="bg-white text-gray-900 rounded-xl px-4 py-1.5 text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  Ver comparación →
                </button>
              )}
              <button
                onClick={() => setCompareSet(new Set())}
                className="text-gray-400 hover:text-white text-sm px-2 py-1.5"
              >
                Limpiar
              </button>
            </div>
          </div>
        )}

        {/* Hotel grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                <div className="h-48 bg-gray-100" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : hotels.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 mb-4">No se encontraron hoteles con estos filtros</p>
            <button onClick={() => { setSearch(""); setCategory(""); setMaxPrice(""); setMinStars(""); setTimeout(fetchHotels, 0); }} className="text-sm text-gray-900 underline">
              Ver todos los hoteles
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {hotels.map((hotel) => {
              const isSelected = compareSet.has(hotel.id);
              return (
                <div
                  key={hotel.id}
                  className={`bg-white rounded-2xl overflow-hidden border transition-all group ${isSelected ? "border-gray-900 ring-2 ring-gray-900" : "border-gray-100 hover:shadow-md"}`}
                >
                  <a href={`/es/hotels/${hotel.slug}`} className="block">
                    <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                      {hotel.images?.[0] && (
                        <img
                          src={hotel.images[0].url}
                          alt={hotel.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                      <span className={`absolute top-3 right-3 text-xs px-2.5 py-1 rounded-full border font-medium ${CAT_COLORS[hotel.category] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                        {CAT_LABELS[hotel.category] ?? hotel.category}
                      </span>
                    </div>
                    <div className="p-5">
                      <h2 className="font-semibold text-gray-900 mb-0.5">{hotel.name}</h2>
                      <p className="text-xs text-gray-400 mb-2">{hotel.locationCity}, {hotel.locationCountry}</p>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Stars n={hotel.starRating} size="xs" />
                          {hotel.avgRating && (
                            <span className="text-xs text-gray-500">{hotel.avgRating} ★</span>
                          )}
                        </div>
                        {hotel.minPricePerNight && (
                          <span className="text-sm font-semibold text-gray-900">
                            ${hotel.minPricePerNight.toLocaleString()}
                            <span className="text-xs font-normal text-gray-400">/noche</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </a>
                  <div className="px-5 pb-4">
                    <button
                      onClick={() => toggleCompare(hotel.id)}
                      className={`w-full rounded-xl py-2 text-xs font-medium transition-colors border ${isSelected ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700"}`}
                    >
                      {isSelected ? "✓ Seleccionado para comparar" : "Comparar"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Compare modal */}
      {showCompare && compareHotels.length >= 2 && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-lg">Comparación de hoteles</h2>
              <button onClick={() => setShowCompare(false)} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left p-4 text-xs font-medium text-gray-500 w-32">Criterio</th>
                    {compareHotels.map((h) => (
                      <th key={h.id} className="p-4 text-left">
                        <p className="font-semibold text-gray-900">{h.name}</p>
                        <p className="text-xs text-gray-400 font-normal">{h.locationCity}</p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Categoría", render: (h: EnrichedHotel) => <span className={`text-xs px-2 py-1 rounded-full border ${CAT_COLORS[h.category]}`}>{CAT_LABELS[h.category]}</span> },
                    { label: "Estrellas", render: (h: EnrichedHotel) => <Stars n={h.starRating} /> },
                    { label: "Calificación", render: (h: EnrichedHotel) => h.avgRating ? <span className="text-amber-500 font-medium">{h.avgRating} ★</span> : <span className="text-gray-300">Sin reseñas</span> },
                    { label: "Precio/noche", render: (h: EnrichedHotel) => h.minPricePerNight ? <span className="font-semibold">${h.minPricePerNight.toLocaleString()}</span> : <span className="text-gray-400">—</span> },
                    { label: "Habitaciones", render: (h: EnrichedHotel) => <span className="text-sm">{h.roomTypes?.length ?? 0} tipos</span> },
                    {
                      label: "Tipos de habitación", render: (h: EnrichedHotel) => (
                        <div className="flex flex-wrap gap-1">
                          {h.roomTypes?.slice(0, 3).map((r: any) => (
                            <span key={r.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{r.name}</span>
                          ))}
                        </div>
                      )
                    },
                  ].map(({ label, render }) => (
                    <tr key={label} className="border-b border-gray-50">
                      <td className="p-4 text-xs font-medium text-gray-500">{label}</td>
                      {compareHotels.map((h) => (
                        <td key={h.id} className="p-4">{render(h)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
              {compareHotels.map((h) => (
                <a key={h.id} href={`/es/hotels/${h.slug}`}
                  className="bg-gray-900 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-gray-800 transition-colors">
                  Ver {h.name} →
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}