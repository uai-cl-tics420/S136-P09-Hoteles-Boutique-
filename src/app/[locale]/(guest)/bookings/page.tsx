"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import Image from "next/image";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente", CONFIRMED: "Confirmada", CANCELLED: "Cancelada", COMPLETED: "Completada",
};
const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-red-50 text-red-600 border-red-200",
  COMPLETED: "bg-gray-100 text-[var(--text-muted)] border-[var(--border)]",
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
      toast.success("Reserva cancelada exitosamente");
      setBookings((b) => b.map((x) => x.id === id ? { ...x, status: "CANCELLED" } : x));
    } else { toast.error("No se pudo cancelar la reserva"); }
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
      if (res.ok) toast.success("Tus preferencias han sido guardadas");
      else toast.error("Error al guardar preferencias");
    } catch { toast.error("Error de conexión"); }
    finally { setSavingPrefs(false); }
  }

  function toggleCat(cat: string) {
    setSelectedCats((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]);
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* Header Premium */}
      <header className="sticky top-0 z-50 glass border-b border-[var(--border-soft)] shadow-[var(--shadow-xs)]">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/es/hotels" className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              ← Explorar hoteles
            </a>
            <span className="text-[var(--border)]">|</span>
            <span className="text-sm font-bold tracking-wide uppercase text-[var(--text-primary)]">Mi Espacio</span>
          </div>
          <a href="/es/profile" className="w-8 h-8 bg-[var(--surface-hover)] rounded-full flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--gold)] hover:text-white transition-all shadow-sm">
            <span className="text-sm">👤</span>
          </a>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-5 py-12">
        {/* Tabs Elegantes */}
        <div className="flex gap-2 p-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-sm mb-10 shadow-[var(--shadow-xs)]">
          {(["bookings", "preferences"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300 ${tab === t ? "bg-[var(--text-primary)] text-white shadow-md" : "text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"}`}>
              {{ bookings: "Mis Reservas", preferences: "Mis Gustos" }[t]}
            </button>
          ))}
        </div>

        {tab === "bookings" && (
          loading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-3xl p-6 border border-[var(--border)] animate-shimmer h-40" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-3xl border border-[var(--border)] shadow-[var(--shadow-xs)] animate-fade-in">
              <span className="text-5xl mb-6 block opacity-50">🧳</span>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Aún no tienes aventuras</h3>
              <p className="text-[var(--text-muted)] mb-8">Descubre propiedades exclusivas y comienza tu viaje.</p>
              <a href="/es/hotels" className="inline-block bg-[var(--gold)] text-white rounded-full px-8 py-3 text-sm font-bold uppercase tracking-widest hover:bg-yellow-600 transition-colors shadow-md hover:-translate-y-0.5">
                Explorar Colección
              </a>
            </div>
          ) : (
            <div className="space-y-6 stagger-children">
              {bookings.map((b: any) => {
                const hotelImage = b.roomType?.hotel?.images?.[0]?.url;
                return (
                  <div key={b.id} className="group bg-white rounded-3xl border border-[var(--border)] shadow-[var(--shadow-xs)] overflow-hidden flex flex-col sm:flex-row hover:shadow-xl transition-all duration-300">
                    {/* Imagen lateral */}
                    <div className="sm:w-48 h-40 sm:h-auto relative bg-[var(--surface)]">
                      {hotelImage ? (
                        <img src={hotelImage} alt="Hotel" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">🏨</div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent sm:hidden" />
                      <div className="absolute bottom-3 left-4 sm:hidden">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${STATUS_COLOR[b.status]}`}>
                          {STATUS_LABEL[b.status] ?? b.status}
                        </span>
                      </div>
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="text-xl font-black text-[var(--text-primary)]">{b.roomType?.hotel?.name ?? "Hotel Premium"}</h3>
                            <p className="text-sm font-medium text-[var(--gold)]">{b.roomType?.name}</p>
                          </div>
                          <span className={`hidden sm:inline-block text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${STATUS_COLOR[b.status]}`}>
                            {STATUS_LABEL[b.status] ?? b.status}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-[var(--text-muted)] font-medium mt-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-lg">📅</span>
                            <span>{b.checkIn} a {b.checkOut}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-lg">👥</span>
                            <span>{b.guestsCount} {b.guestsCount === 1 ? "huésped" : "huéspedes"}</span>
                          </div>
                        </div>

                        {b.extras?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            {b.extras.map((e: any) => (
                              <span key={e.id} className="text-[10px] bg-[var(--surface)] text-[var(--text-primary)] px-2.5 py-1 rounded-full font-semibold uppercase border border-[var(--border)]">
                                + {e.extraService?.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-6 pt-5 border-t border-[var(--border-soft)]">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Costo Total</p>
                          <p className="text-xl font-black text-[var(--text-primary)]">
                            ${parseFloat(b.totalPrice).toLocaleString()} <span className="text-sm font-medium">{b.currency}</span>
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <a href={`/es/bookings/${b.id}`}
                            className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)] rounded-xl px-4 py-2 hover:border-[var(--text-primary)] transition-all">
                            Ver Detalle →
                          </a>
                          {b.status === "COMPLETED" && (
                            <a href={`/es/hotels/${b.roomType?.hotel?.slug}`} className="text-sm font-bold text-[var(--gold)] hover:text-yellow-600 transition-colors underline underline-offset-4">
                              Calificar
                            </a>
                          )}
                          {(b.status === "CONFIRMED" || b.status === "PENDING") && (
                            <button
                              onClick={() => cancelBooking(b.id)}
                              className="text-sm font-bold text-red-500 hover:text-red-700 transition-colors"
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {tab === "preferences" && (
          <div className="space-y-6 animate-slide-up">
            <div className="bg-white rounded-3xl border border-[var(--border)] p-8 shadow-[var(--shadow-xs)]">
              <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2">Tu Perfil de Viajero</h2>
              <p className="text-sm text-[var(--text-muted)] mb-8">Ayúdanos a recomendarte propiedades que se ajusten perfectamente a tu estilo de vida.</p>

              <div className="mb-8">
                <label className="block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4">¿Qué buscas en tu próximo viaje?</label>
                <div className="flex flex-wrap gap-3">
                  {PREF_OPTIONS.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => toggleCat(key)}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 border-2 ${selectedCats.includes(key) ? "bg-[var(--text-primary)] text-[var(--gold)] border-[var(--text-primary)] shadow-md translate-y-[-2px]" : "bg-white text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-10">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Presupuesto Mínimo ($)</label>
                  <input
                    type="number"
                    min={0}
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Presupuesto Máximo ($)</label>
                  <input
                    type="number"
                    min={0}
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    placeholder="Sin límite"
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                onClick={savePreferences}
                disabled={savingPrefs}
                className="w-full sm:w-auto bg-[var(--gold)] text-white rounded-full px-8 py-4 text-sm font-bold tracking-widest uppercase hover:bg-yellow-600 disabled:opacity-50 transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                {savingPrefs ? "Actualizando..." : "Guardar Perfil"}
              </button>
            </div>

            {selectedCats.length > 0 && (
              <div className="bg-transparent mt-10">
                <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)] mb-6">Selección Curada Para Ti</h3>
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
    params.set("limit", "4");
    fetch(`/api/hotels?${params}`).then((r) => r.json())
      .then((d) => { setHotels(d.hotels ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [categories.join(","), budgetMax]);

  if (loading) return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white border border-[var(--border)] rounded-2xl animate-shimmer" />)}</div>;
  if (!hotels.length) return <p className="text-sm text-[var(--text-muted)] italic">No encontramos coincidencias exactas por ahora.</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-children">
      {hotels.map((h: any) => (
        <a key={h.id} href={`/es/hotels/${h.slug}`}
          className="group flex items-center gap-4 p-3 bg-white rounded-2xl border border-[var(--border)] hover:border-[var(--gold)] transition-all hover:shadow-md">
          <div className="w-20 h-20 rounded-xl bg-[var(--surface)] flex-shrink-0 overflow-hidden relative">
            {h.images?.[0] && <img src={h.images[0].url} alt={h.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />}
          </div>
          <div className="flex-1 min-w-0 pr-2">
            <p className="text-sm font-bold text-[var(--text-primary)] truncate">{h.name}</p>
            <p className="text-xs font-medium text-[var(--text-muted)] mt-1">{h.locationCity}</p>
            {h.minPricePerNight && (
              <p className="text-xs font-bold text-[var(--gold)] mt-2">Desde ${parseFloat(h.minPricePerNight).toLocaleString()}</p>
            )}
          </div>
        </a>
      ))}
    </div>
  );
}