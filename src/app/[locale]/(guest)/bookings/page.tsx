"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { getFavorites } from "@/components/FavButton";
import { loadTranslations } from "@/i18n/i18n-util";

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
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "es";
  const [t, setT] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"bookings" | "favorites" | "preferences">("bookings");
  const [prefs, setPrefs] = useState<any>(null);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [favHotels, setFavHotels] = useState<any[]>([]);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    loadTranslations(locale as any).then(setT);
  }, [locale]);

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

  // Load favorites when tab opens
  useEffect(() => {
    if (tab !== "favorites") return;
    const ids = getFavorites();
    if (ids.length === 0) { setFavHotels([]); return; }
    setFavLoading(true);
    Promise.all(
      ids.map((id) => fetch(`/api/hotels/${id}`).then((r) => r.json()).then((d) => d.hotel).catch(() => null))
    ).then((results) => {
      setFavHotels(results.filter(Boolean));
      setFavLoading(false);
    });
  }, [tab]);

  async function cancelBooking(id: string) {
    if (!confirm(t("bookings.cancelConfirm"))) return;
    const res = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success(t("bookings.cancelSuccess"));
      setBookings((b) => b.map((x) => x.id === id ? { ...x, status: "CANCELLED" } : x));
    } else { toast.error(t("bookings.cancelError")); }
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
      if (res.ok) toast.success(t("bookings.preferencesSaved"));
      else toast.error(t("bookings.preferencesError"));
    } catch { toast.error(t("bookings.connectionError")); }
    finally { setSavingPrefs(false); }
  }

  function toggleCat(cat: string) {
    setSelectedCats((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]);
  }

  function removeFav(hotelId: string) {
    const favs: string[] = JSON.parse(localStorage.getItem("hb_favorites") ?? "[]");
    const updated = favs.filter((id) => id !== hotelId);
    localStorage.setItem("hb_favorites", JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("hb:favorites-changed"));
    setFavHotels((h) => h.filter((x) => x.id !== hotelId));
    toast.success(t("bookings.removedFromFavorites"));
  }

  if (!t) return null;

  const tabs = [
    { key: "bookings", label: t("bookings.page.tabBookings") },
    { key: "favorites", label: t("bookings.page.tabFavorites") },
    { key: "preferences", label: t("bookings.page.tabPreferences") },
  ] as const;

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <header className="sticky top-0 z-50 glass border-b border-[var(--border-soft)] shadow-[var(--shadow-xs)]">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href={`/${locale}/hotels`} className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              {t("nav.exploreHotels")}
            </a>
            <span className="text-[var(--border)]">|</span>
            <span className="text-sm font-bold tracking-wide uppercase text-[var(--text-primary)]">{t("bookings.page.mySpace")}</span>
          </div>
          <a href={`/${locale}/profile`} className="w-8 h-8 bg-[var(--surface-hover)] rounded-full flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--gold)] hover:text-white transition-all shadow-sm">
            <span className="text-sm">👤</span>
          </a>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-5 py-12">
        {/* Tabs */}
        <div className="flex gap-2 p-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-max mb-10 shadow-[var(--shadow-xs)]">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 px-5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap ${tab === t.key ? "bg-[var(--text-primary)] text-white shadow-md" : "text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── RESERVAS ── */}
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
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">{t("bookings.page.noAdventures")}</h3>
              <p className="text-[var(--text-muted)] mb-8">{t("bookings.page.noAdventuresDesc")}</p>
              <a href={`/${locale}/hotels`} className="inline-block bg-[var(--gold)] text-white rounded-full px-8 py-3 text-sm font-bold uppercase tracking-widest hover:bg-yellow-600 transition-colors shadow-md hover:-translate-y-0.5">
                {t("bookings.page.exploreCollection")}
              </a>
            </div>
          ) : (
            <div className="space-y-6 stagger-children">
              {bookings.map((b: any) => {
                const hotelImage = b.roomType?.hotel?.images?.[0]?.url;
                return (
                  <div key={b.id} className="group bg-white rounded-3xl border border-[var(--border)] shadow-[var(--shadow-xs)] overflow-hidden flex flex-col sm:flex-row hover:shadow-xl transition-all duration-300">
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
                          <div className="flex items-center gap-1.5"><span className="text-lg">📅</span><span>{b.checkIn} a {b.checkOut}</span></div>
                          <div className="flex items-center gap-1.5"><span className="text-lg">👥</span><span>{b.guestsCount} {b.guestsCount === 1 ? t("common.guest") : t("common.guests")}</span></div>
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
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{t("bookings.totalCost")}</p>
                          <p className="text-xl font-black text-[var(--text-primary)]">
                            ${parseFloat(b.totalPrice).toLocaleString()} <span className="text-sm font-medium">{b.currency}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <a href={`/${locale}/bookings/${b.id}`}
                            className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)] rounded-xl px-4 py-2 hover:border-[var(--text-primary)] transition-all">
                            {t("bookings.viewDetails")} →
                          </a>
                          {b.status === "COMPLETED" && (
                            <a href={`/${locale}/hotels/${b.roomType?.hotel?.slug}`} className="text-sm font-bold text-[var(--gold)] hover:text-yellow-600 transition-colors underline underline-offset-4">
                              {t("bookings.rate")}
                            </a>
                          )}
                          {(b.status === "CONFIRMED" || b.status === "PENDING") && (
                            <button onClick={() => cancelBooking(b.id)} className="text-sm font-bold text-red-500 hover:text-red-700 transition-colors">
                              {t("bookings.cancel")}
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

        {/* ── FAVORITOS ── */}
        {tab === "favorites" && (
          <div className="space-y-6 animate-slide-up">
            {favLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[...Array(4)].map((_, i) => <div key={i} className="h-48 bg-white rounded-3xl border border-[var(--border)] animate-shimmer" />)}
              </div>
            ) : favHotels.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-3xl border border-[var(--border)] shadow-[var(--shadow-xs)]">
                <span className="text-5xl mb-6 block">♡</span>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">{t("bookings.page.noFavorites")}</h3>
                <p className="text-[var(--text-muted)] mb-8">{t("bookings.page.noFavoritesDesc")}</p>
                <a href={`/${locale}/hotels`} className="inline-block bg-[var(--text-primary)] text-white rounded-full px-8 py-3 text-sm font-bold uppercase tracking-widest hover:bg-[var(--gold)] transition-colors shadow-md">
                  {t("bookings.page.exploreHotels")}
                </a>
              </div>
            ) : (
              <>
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">{favHotels.length} {favHotels.length === 1 ? t("bookings.page.propertiesSaved") : t("bookings.page.propertiesSavedPlural")}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {favHotels.map((h: any) => (
                    <div key={h.id} className="group bg-white rounded-3xl border border-[var(--border)] overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                      <div className="relative h-44 overflow-hidden bg-[var(--surface)]">
                        {h.images?.[0] ? (
                          <img src={h.images[0].url} alt={h.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">🏨</div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <button
                          onClick={() => removeFav(h.id)}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center text-sm hover:bg-red-600 transition-colors shadow-md"
                          title={t("bookings.removeFromFavorites")}
                        >♥</button>
                      </div>
                      <div className="p-5">
                        <h3 className="text-base font-black text-[var(--text-primary)] truncate">{h.name}</h3>
                        <p className="text-xs font-medium text-[var(--text-muted)] mt-0.5">{h.locationCity}, {h.locationCountry}</p>
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--border-soft)]">
                          {h.roomTypes?.[0] && (
                            <p className="text-sm font-black text-[var(--text-primary)]">
                              Desde ${parseFloat(h.roomTypes[0].pricePerNight).toLocaleString()}
                              <span className="text-xs font-normal text-[var(--text-muted)] ml-1">{t("common.perNight")}</span>
                            </p>
                          )}
                          <a href={`/${locale}/hotels/${h.slug}`}
                            className="text-[10px] font-bold uppercase tracking-widest bg-[var(--text-primary)] text-white px-4 py-2 rounded-xl hover:bg-[var(--gold)] transition-colors">
                            {t("bookings.view")} →
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── PREFERENCIAS ── */}
        {tab === "preferences" && (
          <div className="space-y-6 animate-slide-up">
            <div className="bg-white rounded-3xl border border-[var(--border)] p-8 shadow-[var(--shadow-xs)]">
              <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2">{t("bookings.page.travelerProfile")}</h2>
              <p className="text-sm text-[var(--text-muted)] mb-8">{t("bookings.page.travelerProfileDesc")}</p>

              <div className="mb-8">
                <label className="block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4">{t("bookings.page.whatLooking")}</label>
                <div className="flex flex-wrap gap-3">
                  {PREF_OPTIONS.map(({ key, label }) => (
                    <button key={key} onClick={() => toggleCat(key)}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 border-2 ${selectedCats.includes(key) ? "bg-[var(--text-primary)] text-[var(--gold)] border-[var(--text-primary)] shadow-md translate-y-[-2px]" : "bg-white text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-10">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">{t("bookings.page.budgetMin")}</label>
                  <input type="number" min={0} value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} placeholder="0"
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:border-transparent transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">{t("bookings.page.budgetMax")}</label>
                  <input type="number" min={0} value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} placeholder={t("bookings.page.noLimit")}
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:border-transparent transition-all" />
                </div>
              </div>

              <button onClick={savePreferences} disabled={savingPrefs}
                className="w-full sm:w-auto bg-[var(--gold)] text-white rounded-full px-8 py-4 text-sm font-bold tracking-widest uppercase hover:bg-yellow-600 disabled:opacity-50 transition-all shadow-md hover:shadow-lg active:scale-95">
                {savingPrefs ? t("loading") : t("bookings.page.saveProfile")}
              </button>
            </div>

            {selectedCats.length > 0 && (
              <div className="bg-transparent mt-10">
                <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)] mb-6">{t("bookings.page.curatedSelection")}</h3>
                <RecommendedHotels categories={selectedCats} budgetMax={budgetMax ? parseInt(budgetMax) : undefined} locale={locale} />
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function RecommendedHotels({ categories, budgetMax, locale }: { categories: string[]; budgetMax?: number; locale: string }) {
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch hotels for ALL preferred categories, then deduplicate + score
    const fetchAll = async () => {
      setLoading(true);
      try {
        const catFetches = categories.map((cat) => {
          const p = new URLSearchParams({ category: cat, limit: "8" });
          if (budgetMax) p.set("maxPrice", budgetMax.toString());
          return fetch(`/api/hotels?${p}`).then((r) => r.json()).then((d) => d.hotels ?? []);
        });
        const results: any[][] = await Promise.all(catFetches);

        // Merge, deduplicate by id, compute match score
        const seen = new Map<string, any>();
        results.forEach((list, idx) => {
          list.forEach((h: any) => {
            if (!seen.has(h.id)) {
              seen.set(h.id, { ...h, _matchCount: 0, _matchCats: [] });
            }
            const entry = seen.get(h.id)!;
            entry._matchCount += 1;
            entry._matchCats.push(categories[idx]);
          });
        });

        const merged = [...seen.values()]
          .sort((a, b) => b._matchCount - a._matchCount || (b.avgRating ?? 0) - (a.avgRating ?? 0))
          .slice(0, 6);

        setHotels(merged);
      } catch {
        setHotels([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [categories.join(","), budgetMax]);

  if (loading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white border border-[var(--border)] rounded-2xl animate-shimmer" />)}
    </div>
  );
  if (!hotels.length) return <p className="text-sm text-[var(--text-muted)] italic">No encontramos coincidencias exactas por ahora.</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-children">
      {hotels.map((h: any) => {
        const matchPct = Math.round((h._matchCount / categories.length) * 100);
        return (
          <a key={h.id} href={`/${locale}/hotels/${h.slug}`}
            className="group flex items-center gap-4 p-3 bg-white rounded-2xl border border-[var(--border)] hover:border-[var(--gold)] transition-all hover:shadow-md relative overflow-hidden">
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
            {/* Match badge */}
            <div className={`absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${
              matchPct === 100
                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                : matchPct >= 50
                  ? "bg-[var(--gold-light)] text-[var(--gold-dark)] border border-[var(--gold)]/30"
                  : "bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]"
            }`}>
              {matchPct === 100 ? "✓ " : ""}{matchPct}% match
            </div>
          </a>
        );
      })}
    </div>
  );
}