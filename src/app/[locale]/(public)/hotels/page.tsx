"use client";
import { useState, useEffect } from "react";
import type { Hotel } from "@/types/domain";

export default function HotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchHotels() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("city", search);
    if (category) params.set("category", category);
    const res = await fetch(`/api/hotels?${params}`);
    const data = await res.json();
    setHotels(data.hotels ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchHotels(); }, []);

  const categories = ["LUXURY", "BOUTIQUE", "ECO", "BEACH", "MOUNTAIN", "CITY"];
  const categoryLabels: Record<string, string> = {
    LUXURY: "Lujo", BOUTIQUE: "Boutique", ECO: "Eco",
    BEACH: "Playa", MOUNTAIN: "Montaña", CITY: "Ciudad",
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/es/hotels" className="text-lg font-semibold text-gray-900">Hoteles Boutique</a>
          <div className="flex gap-3">
            <a href="/es/bookings" className="text-sm text-gray-600 hover:text-gray-900">Mis reservas</a>
            <a href="/es/auth/login" className="text-sm text-gray-600 hover:text-gray-900">Cuenta</a>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero search */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Encuentra tu hotel ideal</h1>
          <p className="text-gray-500 mb-6">Experiencias exclusivas y personalizadas</p>
          <div className="flex gap-2 max-w-xl mx-auto">
            <input value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && fetchHotels()}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="Ciudad o nombre del hotel..." />
            <button onClick={fetchHotels}
              className="bg-gray-900 text-white rounded-xl px-5 py-3 text-sm font-medium hover:bg-gray-800 transition-colors">
              Buscar
            </button>
          </div>
        </div>

        {/* Category filters */}
        <div className="flex gap-2 flex-wrap mb-8">
          <button onClick={() => { setCategory(""); fetchHotels(); }}
            className={`px-4 py-2 rounded-full text-sm border transition-colors ${category === "" ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-600 hover:border-gray-900"}`}>
            Todos
          </button>
          {categories.map(c => (
            <button key={c} onClick={() => { setCategory(c); }}
              className={`px-4 py-2 rounded-full text-sm border transition-colors ${category === c ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-600 hover:border-gray-900"}`}>
              {categoryLabels[c]}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <div className="text-center py-20 text-gray-500">No se encontraron hoteles</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotels.map(hotel => (
              <a key={hotel.id} href={`/es/hotels/${hotel.slug}`}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow group">
                <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                  {hotel.images?.[0] && (
                    <img src={hotel.images[0].url} alt={hotel.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  )}
                  <span className="absolute top-3 right-3 bg-white text-gray-700 text-xs px-2 py-1 rounded-full font-medium">
                    {categoryLabels[hotel.category] ?? hotel.category}
                  </span>
                </div>
                <div className="p-5">
                  <h2 className="font-semibold text-gray-900 mb-1">{hotel.name}</h2>
                  <p className="text-sm text-gray-500 mb-3">{hotel.locationCity}, {hotel.locationCountry}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{"★".repeat(hotel.starRating)}</span>
                    <span className="text-sm font-medium text-gray-900">Ver detalles →</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}