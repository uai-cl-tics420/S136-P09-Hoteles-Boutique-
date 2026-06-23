"use client";
import { useState, useEffect } from "react";
import { getCompareList, type CompareItem } from "./CompareButton";
import { loadTranslations } from "@/i18n/i18n-util";

const CAT_LABELS: Record<string, string> = {
  LUXURY: "Lujo", BOUTIQUE: "Boutique", ECO: "Eco",
  BEACH: "Playa", MOUNTAIN: "Montaña", CITY: "Ciudad",
};

const EXTRA_ICONS: Record<string, string> = {
  SPA: "🧖", DINING: "🍽️", TRANSPORT: "🚗", EXPERIENCE: "🎭", OTHER: "✨",
};

interface Props { locale: string; }
interface HotelDetail {
  id: string;
  name: string;
  category: string;
  starRating: number;
  locationCity: string;
  minPricePerNight: number | null;
  imageUrl?: string;
  slug: string;
  roomTypes?: {
    id: string; name: string; pricePerNight: string;
    capacity: number; amenities?: string[];
  }[];
  extraServices?: {
    id: string; name: string; category: string; price: string;
  }[];
}

function allAmenities(hotel: HotelDetail): string[] {
  const set = new Set<string>();
  for (const rt of hotel.roomTypes ?? []) {
    for (const am of rt.amenities ?? []) set.add(am);
  }
  return [...set].sort();
}

function allExtras(hotel: HotelDetail): string[] {
  return (hotel.extraServices ?? []).map((e) => e.name);
}

export default function ComparisonBar({ locale }: Props) {
  const [list, setList] = useState<CompareItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [details, setDetails] = useState<HotelDetail[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "amenities" | "services">("overview");
  const [t, setT] = useState<any>(null);

  useEffect(() => {
    loadTranslations(locale as any).then(setT);
  }, [locale]);

  useEffect(() => {
    const update = () => setList(getCompareList());
    update();
    window.addEventListener("hb:compare-changed", update);
    return () => window.removeEventListener("hb:compare-changed", update);
  }, []);

  // Load full hotel details when modal opens
  useEffect(() => {
    if (!showModal || list.length === 0) return;
    setLoadingDetails(true);
    Promise.all(
      list.map((h) =>
        fetch(`/api/hotels/${h.id}`)
          .then((r) => r.json())
          .then((d) => d.hotel as HotelDetail)
          .catch(() => null)
      )
    ).then((results) => {
      setDetails(results.filter(Boolean) as HotelDetail[]);
      setLoadingDetails(false);
    });
  }, [showModal, list.map(h => h.id).join(",")]);

  function remove(id: string) {
    const current = getCompareList().filter((h) => h.id !== id);
    localStorage.setItem("hb_compare", JSON.stringify(current));
    window.dispatchEvent(new CustomEvent("hb:compare-changed"));
  }

  function clearAll() {
    localStorage.setItem("hb_compare", "[]");
    window.dispatchEvent(new CustomEvent("hb:compare-changed"));
    setShowModal(false);
  }

  if (!t) return null;
  if (list.length < 2 && !showModal) return null;

  // Union sets for amenities and extras
  const unionAmenities = details.length > 0
    ? [...new Set(details.flatMap(allAmenities))].sort()
    : [];
  const unionExtras = details.length > 0
    ? [...new Set(details.flatMap(allExtras))].sort()
    : [];

  // Find best price for highlight
  const prices = details.map((h) => h.minPricePerNight ?? Infinity);
  const bestPrice = Math.min(...prices);

  return (
    <>
      {/* Floating bar */}
      {!showModal && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="flex items-center gap-3 bg-[var(--text-primary)] text-white rounded-2xl px-5 py-3 shadow-2xl border border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 mr-1">
              {t("hotels.comparing")}
            </span>
            {list.map((h) => (
              <div key={h.id} className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-1.5">
                <span className="text-sm font-bold truncate max-w-[120px]">{h.name}</span>
                <button
                  onClick={() => remove(h.id)}
                  className="w-4 h-4 rounded-full bg-white/20 hover:bg-red-400/80 flex items-center justify-center text-[10px] transition-colors"
                >✕</button>
              </div>
            ))}
            <button
              onClick={() => { setActiveTab("overview"); setShowModal(true); }}
              className="bg-[var(--gold)] text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-yellow-500 transition-colors shadow-sm ml-1 whitespace-nowrap"
            >
              {t("hotels.viewComparison")} →
            </button>
            <button
              onClick={clearAll}
              className="text-white/40 hover:text-white text-[10px] uppercase tracking-widest transition-colors"
            >
              {t("hotels.clear")}
            </button>
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-[var(--background)] rounded-3xl border border-[var(--border)] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-auto animate-scale-in">
            {/* Header */}
            <div className="sticky top-0 bg-[var(--background)] border-b border-[var(--border)] p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-black text-[var(--text-primary)]">{t("hotels.propertyComparator")}</h2>
                <p className="text-xs font-medium text-[var(--text-muted)] mt-1">
                  {list.length} {list.length === 1 ? t("hotels.property") : t("hotels.properties")} · {t("hotels.detailedAnalysis")}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center hover:bg-[var(--surface-hover)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >✕</button>
            </div>

            <div className="p-6">
              {/* Tab switcher */}
              <div className="flex gap-2 p-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-full w-max mb-8 shadow-[var(--shadow-xs)]">
                {(["overview", "amenities", "services"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                      activeTab === tab
                        ? "bg-[var(--text-primary)] text-white shadow-md"
                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {{ overview: t("hotels.general"), amenities: t("hotels.amenities"), services: t("hotels.extraServices") }[tab]}
                  </button>
                ))}
              </div>

              {loadingDetails ? (
                <div className={`grid gap-5 ${list.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                  {list.map((h) => (
                    <div key={h.id} className="h-64 bg-white rounded-2xl border border-[var(--border)] animate-shimmer" />
                  ))}
                </div>
              ) : (
                <>
                  {/* ── OVERVIEW TAB ───────────────────── */}
                  {activeTab === "overview" && (
                    <div className={`grid gap-5 ${list.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                      {details.map((h) => (
                        <div key={h.id} className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm">
                          {/* Image */}
                          <div className="relative h-48 bg-[var(--surface)]">
                            {h.imageUrl
                              ? <img src={h.imageUrl} alt={h.name} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">🏨</div>
                            }
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-4 left-4">
                              <p className="text-white font-black text-lg leading-tight">{h.name}</p>
                              <p className="text-white/70 text-xs mt-0.5">{h.locationCity}</p>
                            </div>
                            <button
                              onClick={() => remove(h.id)}
                              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/40 hover:bg-red-500 text-white text-xs flex items-center justify-center transition-colors"
                            >✕</button>
                          </div>

                          {/* Data table */}
                          <div className="p-5 space-y-3">
                            {[
                              { label: t("hotels.category"), value: CAT_LABELS[h.category] ?? h.category },
                              {
                                label: t("hotels.rating"),
                                value: (
                                  <span className="text-[var(--gold)]">
                                    {"★".repeat(h.starRating)}{"☆".repeat(5 - h.starRating)}
                                  </span>
                                )
                              },
                              {
                                label: t("hotels.priceFrom"),
                                value: (
                                  <span className={h.minPricePerNight === bestPrice && details.length > 1 ? "text-emerald-600 font-black" : ""}>
                                    {h.minPricePerNight
                                      ? `$${Number(h.minPricePerNight).toLocaleString("es-CL")} ${t("common.perNight")}`
                                      : t("hotels.consult")}}
                                    {h.minPricePerNight === bestPrice && details.length > 1 && (
                                      <span className="ml-2 text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-widest">{t("hotels.bestPrice")}</span>
                                    )}
                                  </span>
                                )
                              },
                              { label: t("hotels.city"), value: h.locationCity },
                              {
                                label: t("hotels.roomTypes"),
                                value: `${h.roomTypes?.length ?? 0} ${t("hotels.available")}`
                              },
                              {
                                label: t("hotels.extraServices"),
                                value: `${h.extraServices?.length ?? 0} ${t("hotels.available")}`
                              },
                            ].map(({ label, value }) => (
                              <div key={label} className="flex justify-between items-center py-2 border-b border-[var(--border-soft)] last:border-0">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{label}</p>
                                <p className="text-sm font-bold text-[var(--text-primary)] text-right max-w-[60%]">{value as any}</p>
                              </div>
                            ))}
                          </div>

                          <div className="px-5 pb-5">
                            <a
                              href={`/${locale}/hotels/${h.slug}`}
                              className="block w-full text-center bg-[var(--text-primary)] text-white rounded-xl py-3 text-xs font-bold uppercase tracking-widest hover:bg-[var(--gold)] transition-colors shadow-sm"
                            >
                              {t("hotels.viewHotel")} →
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── AMENITIES TAB ──────────────────── */}
                  {activeTab === "amenities" && (
                    <div>
                      {unionAmenities.length === 0 ? (
                        <p className="text-sm text-[var(--text-muted)] text-center py-12">{t("hotels.noAmenitiesInfo")}</p>
                      ) : (
                        <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-[var(--surface)] border-b border-[var(--border)]">
                                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] w-44">{t("hotels.amenity")}</th>
                                {details.map((h) => (
                                  <th key={h.id} className="p-4 text-xs font-black text-[var(--text-primary)] text-center">
                                    <div className="flex flex-col items-center gap-1">
                                      <div className="w-8 h-8 rounded-lg bg-[var(--gold)]/10 flex items-center justify-center text-sm">🏨</div>
                                      <span className="truncate max-w-[120px]">{h.name.split(" ").slice(0, 2).join(" ")}</span>
                                    </div>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-soft)]">
                              {unionAmenities.map((am) => {
                                const counts = details.map((h) => allAmenities(h).includes(am));
                                return (
                                  <tr key={am} className="hover:bg-[var(--surface-hover)] transition-colors">
                                    <td className="p-4 text-sm font-medium text-[var(--text-secondary)]">{am}</td>
                                    {counts.map((has, i) => (
                                      <td key={i} className="p-4 text-center">
                                        {has
                                          ? <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full inline-flex items-center justify-center text-xs font-black">✓</span>
                                          : <span className="w-6 h-6 bg-[var(--surface)] text-[var(--border)] rounded-full inline-flex items-center justify-center text-xs">—</span>
                                        }
                                      </td>
                                    ))}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                          {/* Summary row */}
                          <div className="bg-[var(--surface)] border-t border-[var(--border)] p-4 flex items-center gap-3">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{t("hotels.totalAmenities")}:</span>
                            {details.map((h) => (
                              <span key={h.id} className="text-sm font-black text-[var(--text-primary)]">
                                {h.name.split(" ")[0]}: <span className="text-[var(--gold)]">{allAmenities(h).length}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── SERVICES TAB ───────────────────── */}
                  {activeTab === "services" && (
                    <div>
                      {unionExtras.length === 0 ? (
                        <p className="text-sm text-[var(--text-muted)] text-center py-12">{t("hotels.noExtraServices")}</p>
                      ) : (
                        <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-[var(--surface)] border-b border-[var(--border)]">
                                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] w-44">{t("hotels.service")}</th>
                                {details.map((h) => (
                                  <th key={h.id} className="p-4 text-xs font-black text-[var(--text-primary)] text-center">
                                    <span className="truncate max-w-[120px]">{h.name.split(" ").slice(0, 2).join(" ")}</span>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-soft)]">
                              {unionExtras.map((extName) => {
                                return (
                                  <tr key={extName} className="hover:bg-[var(--surface-hover)] transition-colors">
                                    <td className="p-4 text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                                      {details
                                        .flatMap((h) => h.extraServices ?? [])
                                        .find((e) => e.name === extName)
                                        ?.category
                                        ? <span>{EXTRA_ICONS[details.flatMap(h => h.extraServices ?? []).find(e => e.name === extName)?.category ?? "OTHER"] ?? "✨"}</span>
                                        : null
                                      }
                                      {extName}
                                    </td>
                                    {details.map((h, i) => {
                                      const svc = (h.extraServices ?? []).find((e) => e.name === extName);
                                      return (
                                        <td key={i} className="p-4 text-center">
                                          {svc ? (
                                            <div className="flex flex-col items-center gap-0.5">
                                              <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full inline-flex items-center justify-center text-xs font-black">✓</span>
                                              <span className="text-[10px] font-bold text-[var(--gold)]">${parseFloat(svc.price).toLocaleString("es-CL")}</span>
                                            </div>
                                          ) : (
                                            <span className="w-6 h-6 bg-[var(--surface)] text-[var(--border)] rounded-full inline-flex items-center justify-center text-xs">—</span>
                                          )}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              <div className="mt-8 flex justify-center">
                <button
                  onClick={clearAll}
                  className="text-sm font-bold text-[var(--text-muted)] hover:text-red-500 transition-colors uppercase tracking-widest"
                >
                  {t("hotels.clearComparison")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
