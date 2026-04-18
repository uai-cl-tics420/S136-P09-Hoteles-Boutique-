"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente", CONFIRMED: "Confirmada", CANCELLED: "Cancelada", COMPLETED: "Completada",
};
const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMED: "bg-green-50 text-green-700 border-green-200",
  CANCELLED: "bg-red-50 text-red-600 border-red-200",
  COMPLETED: "bg-gray-100 text-gray-600 border-gray-200",
};

const PREF_OPTIONS = [
  { key: "LUXURY", label: "Lujo" }, { key: "ECO", label: "Eco / Naturaleza" },
  { key: "BEACH", label: "Playa" }, { key: "MOUNTAIN", label: "Montaña" },
  { key: "BOUTIQUE", label: "Boutique" }, { key: "CITY", label: "Ciudad" },
];

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"bookings" | "preferences">("bookings");
  const [prefs, setPrefs] = useState<any>(null);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/bookings").then((r) => r.json()),
      fetch("/api/preferences").then((r) => r.json()).catch(() => ({ preferences: null })),
    ]).then(([b, p]) => {
      setBookings(b.bookings ?? []);
      if (p.preferences) {
        setPrefs(p.preferences);
        setSelectedCats(p.preferences.preferredCategories ?? []);
        setBudgetMin(p.preferences.budgetMin?.toString() ?? "");
        setBudgetMax(p.preferences.budgetMax?.toString() ?? "");
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function cancelBooking(id: string) {
    if (!confirm("¿Cancelar esta reserva?")) return;
    const res = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Reserva cancelada");
      setBookings((b) => b.map((x) => x.id === id ? { ...x, status: "CANCELLED" } : x));
    } else { toast.error("No se pudo cancelar"); }
  }

  async function savePreferences() {
    setSavingPrefs(true);
    try {
      const res = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferredCategories: selectedCats,
          budgetMin: budgetMin ? parseInt(budgetMin) : null,
          budgetMax: budgetMax ? parseInt(budgetMax) : null,
        }),
      });
      if (res.ok) toast.success("Preferencias guardadas");
      else toast.error("Error al guardar");
    } catch { toast.error("Error de conexión"); }
    finally { setSavingPrefs(false); }
  }

  function toggleCat(cat: string) {
    setSelectedCats((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]);
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/es/hotels" className="text-sm text-gray-400 hover:text-gray-900">← Hoteles</a>
            <span className="text-sm font-semibold text-gray-900">Mi cuenta</span>
          </div>
          <a href="/es/hotels/reviews" className="text-sm text-gray-500 hover:text-gray-900">Ver rankings</a>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl max-w-xs mb-8">
          {(["bookings", "preferences"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
              {{ bookings: "Mis reservas", preferences: "Preferencias" }[t]}
            </button>
          ))}
        </div>

        {tab === "bookings" && (
          loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse h-24" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 mb-4">No tienes reservas aún</p>
              <a href="/es/hotels" className="bg-gray-900 text-white rounded-xl px-6 py-3 text-sm font-medium hover:bg-gray-800 transition-colors">
                Explorar hoteles
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((b: any) => (
                <div key={b.id} className="bg-white rounded-2xl border border-gray-100 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{b.roomType?.hotel?.name ?? "Hotel"}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{b.roomType?.name}</p>
                      <p className="text-sm text-gray-500">
                        {b.checkIn} → {b.checkOut}
                        {b.guestsCount > 1 && <span className="ml-2 text-gray-400">· {b.guestsCount} huéspedes</span>}
                      </p>
                      {b.specialRequests && (
                        <p className="text-xs text-gray-400 mt-1 italic">"{b.specialRequests}"</p>
                      )}
                      {b.extras?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {b.extras.map((e: any) => (
                            <span key={e.id} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                              {e.extraService?.name}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-sm font-semibold text-gray-900 mt-2">
                        Total: ${parseFloat(b.totalPrice).toLocaleString()} {b.currency}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-4">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium border ${STATUS_COLOR[b.status]}`}>
                        {STATUS_LABEL[b.status] ?? b.status}
                      </span>
                      {b.status === "CONFIRMED" && (
                        <button
                          onClick={() => cancelBooking(b.id)}
                          className="text-xs text-red-400 hover:text-red-600 hover:underline"
                        >
                          Cancelar reserva
                        </button>
                      )}
                      {b.status === "COMPLETED" && (
                        <a href={`/es/hotels`} className="text-xs text-gray-400 hover:text-gray-700 hover:underline">
                          Dejar reseña
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === "preferences" && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-1">Mis preferencias de viaje</h2>
              <p className="text-xs text-gray-400 mb-5">Personalizamos tus recomendaciones según tus gustos</p>

              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de experiencia preferida</label>
                <div className="flex flex-wrap gap-2">
                  {PREF_OPTIONS.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => toggleCat(key)}
                      className={`px-4 py-2 rounded-full text-sm border transition-colors ${selectedCats.includes(key) ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-600 hover:border-gray-400"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Presupuesto mínimo/noche ($)</label>
                  <input
                    type="number"
                    min={0}
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value)}
                    placeholder="Ej: 50"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Presupuesto máximo/noche ($)</label>
                  <input
                    type="number"
                    min={0}
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    placeholder="Ej: 500"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </div>

              <button
                onClick={savePreferences}
                disabled={savingPrefs}
                className="bg-gray-900 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {savingPrefs ? "Guardando..." : "Guardar preferencias"}
              </button>
            </div>

            {selectedCats.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="font-semibold text-gray-900 mb-3">Hoteles recomendados para ti</h2>
                <RecommendedHotels categories={selectedCats} budgetMax={budgetMax ? parseInt(budgetMax) : undefined} />
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function RecommendedHotels({ categories, budgetMax }: { categories: string[]; budgetMax?: number }) {
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (categories.length) params.set("category", categories[0]);
    if (budgetMax) params.set("maxPrice", budgetMax.toString());
    params.set("limit", "6");
    fetch(`/api/hotels?${params}`).then((r) => r.json())
      .then((d) => { setHotels(d.hotels ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [categories.join(","), budgetMax]);

  if (loading) return <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}</div>;
  if (!hotels.length) return <p className="text-sm text-gray-400">No encontramos hoteles con esas preferencias</p>;

  return (
    <div className="space-y-2">
      {hotels.slice(0, 4).map((h: any) => (
        <a key={h.id} href={`/es/hotels/${h.slug}`}
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
            {h.images?.[0] && <img src={h.images[0].url} alt={h.name} className="w-full h-full object-cover" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{h.name}</p>
            <p className="text-xs text-gray-400">{h.locationCity} · {"★".repeat(h.starRating)}</p>
          </div>
          {h.minPricePerNight && (
            <span className="text-sm font-semibold text-gray-900 flex-shrink-0">${h.minPricePerNight}</span>
          )}
        </a>
      ))}
    </div>
  );
}