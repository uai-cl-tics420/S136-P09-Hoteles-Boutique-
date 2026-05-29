"use client";
import { useState, useEffect } from "react";
import { getCompareList, type CompareItem } from "./CompareButton";

const CAT_LABELS: Record<string, string> = {
  LUXURY: "Lujo", BOUTIQUE: "Boutique", ECO: "Eco",
  BEACH: "Playa", MOUNTAIN: "Montaña", CITY: "Ciudad",
};

interface Props {
  locale: string;
}

export default function ComparisonBar({ locale }: Props) {
  const [list, setList] = useState<CompareItem[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const update = () => setList(getCompareList());
    update();
    window.addEventListener("hb:compare-changed", update);
    return () => window.removeEventListener("hb:compare-changed", update);
  }, []);

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

  if (list.length < 2 && !showModal) return null;

  return (
    <>
      {/* Floating bar */}
      {!showModal && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="flex items-center gap-3 bg-[var(--text-primary)] text-white rounded-2xl px-5 py-3 shadow-2xl border border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 mr-1">
              Comparando
            </span>
            {list.map((h) => (
              <div key={h.id} className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-1.5">
                <span className="text-sm font-bold truncate max-w-[120px]">{h.name}</span>
                <button
                  onClick={() => remove(h.id)}
                  className="w-4 h-4 rounded-full bg-white/20 hover:bg-red-400/80 flex items-center justify-center text-[10px] transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              onClick={() => setShowModal(true)}
              className="bg-[var(--gold)] text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-yellow-500 transition-colors shadow-sm ml-1 whitespace-nowrap"
            >
              Ver Comparación →
            </button>
            <button
              onClick={clearAll}
              className="text-white/40 hover:text-white text-[10px] uppercase tracking-widest transition-colors"
            >
              Limpiar
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
            <div className="sticky top-0 bg-[var(--background)] border-b border-[var(--border)] p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-black text-[var(--text-primary)]">Comparador de Propiedades</h2>
                <p className="text-xs font-medium text-[var(--text-muted)] mt-1">
                  {list.length} propiedades seleccionadas
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-10 h-10 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center hover:bg-[var(--surface-hover)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <div className={`grid gap-5 ${list.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                {list.map((h) => (
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
                        { label: "Categoría", value: CAT_LABELS[h.category] ?? h.category },
                        {
                          label: "Clasificación",
                          value: (
                            <span className="text-[var(--gold)]">
                              {"★".repeat(h.starRating)}{"☆".repeat(5 - h.starRating)}
                            </span>
                          )
                        },
                        {
                          label: "Precio desde",
                          value: h.minPricePerNight
                            ? `$${Number(h.minPricePerNight).toLocaleString()} / noche`
                            : "Consultar"
                        },
                        { label: "Ciudad", value: h.locationCity },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between items-center py-2 border-b border-[var(--border-soft)] last:border-0">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{label}</p>
                          <p className="text-sm font-bold text-[var(--text-primary)]">{value as any}</p>
                        </div>
                      ))}
                    </div>

                    <div className="px-5 pb-5">
                      <a
                        href={`/${locale}/hotels/${h.slug}`}
                        className="block w-full text-center bg-[var(--text-primary)] text-white rounded-xl py-3 text-xs font-bold uppercase tracking-widest hover:bg-[var(--gold)] transition-colors shadow-sm"
                      >
                        Ver Hotel →
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  onClick={clearAll}
                  className="text-sm font-bold text-[var(--text-muted)] hover:text-red-500 transition-colors uppercase tracking-widest"
                >
                  Limpiar comparación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
