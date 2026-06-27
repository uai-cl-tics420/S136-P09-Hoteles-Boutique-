"use client";
import { useState, useRef, useEffect, useCallback } from "react";

// ── Typing suggestions that rotate in the placeholder ────────────────────────
const SUGGESTIONS = [
  "Quiero celebrar mi aniversario con spa y cena gourmet frente al mar...",
  "Busco un eco-lodge en Patagonia para hacer trekking este fin de semana...",
  "Necesito algo de lujo extremo en Buenos Aires, sin límite de presupuesto...",
  "Escapada romántica con masajes y vista a la montaña en Chile...",
  "Hotel de playa con alta gastronomía para luna de miel en Perú...",
  "Quiero desconectarme del mundo en un lugar tranquilo y exclusivo...",
];

const CAT_COLORS: Record<string, string> = {
  LUXURY:   "bg-purple-100 text-purple-800 border-purple-200",
  BOUTIQUE: "bg-rose-100 text-rose-800 border-rose-200",
  ECO:      "bg-emerald-100 text-emerald-800 border-emerald-200",
  BEACH:    "bg-sky-100 text-sky-800 border-sky-200",
  MOUNTAIN: "bg-amber-100 text-amber-800 border-amber-200",
  CITY:     "bg-zinc-100 text-zinc-700 border-zinc-200",
};
const CAT_LABELS: Record<string, string> = {
  LUXURY: "Lujo", BOUTIQUE: "Boutique", ECO: "Eco", BEACH: "Playa", MOUNTAIN: "Montaña", CITY: "Ciudad",
};
const EXP_LABELS: Record<string, string> = {
  SPA: "✦ Spa & Bienestar", DINING: "✦ Gastronomía", TRANSPORT: "✦ Transporte", EXPERIENCE: "✦ Experiencias",
};

interface Hotel {
  id: string; slug: string; name: string; category: string;
  starRating: number; locationCity: string; locationCountry: string;
  minPricePerNight?: number | null;
  images?: { url: string }[];
  avgRating?: number | null;
}

interface ConciergeResult {
  hotels: Hotel[];
  reasoning: string;
  mood: string;
  highlights: string[];
  detectedFilters: { category: string | null; experienceType: string | null; minStars: number | null; country: string | null };
  usingAI: boolean;
}

interface Props {
  locale: string;
  onResultsChange?: (hotels: Hotel[], reasoning: string) => void;
}

export default function AIConciergeSearch({ locale, onResultsChange }: Props) {
  const [query, setQuery]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [result, setResult]             = useState<ConciergeResult | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const [suggestionIdx, setSuggestionIdx] = useState(0);
  const [displayedSuggestion, setDisplayedSuggestion] = useState("");
  const [isFocused, setIsFocused]       = useState(false);
  const [showResults, setShowResults]   = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Typewriter cycling through suggestions
  useEffect(() => {
    if (isFocused || loading) return;
    let charIdx = 0;
    const suggestion = SUGGESTIONS[suggestionIdx];
    let forward = true;

    const tick = () => {
      if (forward) {
        charIdx++;
        if (charIdx > suggestion.length) {
          forward = false;
          typingTimer.current = setTimeout(tick, 1800);
          return;
        }
      } else {
        charIdx--;
        if (charIdx < 0) {
          setSuggestionIdx(i => (i + 1) % SUGGESTIONS.length);
          return;
        }
      }
      setDisplayedSuggestion(suggestion.slice(0, charIdx));
      typingTimer.current = setTimeout(tick, forward ? 40 : 18);
    };

    setDisplayedSuggestion("");
    typingTimer.current = setTimeout(tick, 600);
    return () => { if (typingTimer.current) clearTimeout(typingTimer.current); };
  }, [isFocused, loading, suggestionIdx]);

  const handleSearch = useCallback(async () => {
    if (!query.trim() || query.trim().length < 5) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setShowResults(false);

    try {
      const res = await fetch("/api/ai-concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), locale }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error desconocido"); return; }
      setResult(data);
      // Stagger the reveal for dramatic effect
      setTimeout(() => setShowResults(true), 200);
      onResultsChange?.(data.hotels, data.reasoning);
    } catch {
      setError("No se pudo conectar con el concierge. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, [query, locale, onResultsChange]);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey || !e.shiftKey)) {
      e.preventDefault();
      handleSearch();
    }
  }

  function handleReset() {
    setQuery(""); setResult(null); setError(null); setShowResults(false);
    onResultsChange?.([], "");
    textareaRef.current?.focus();
  }

  return (
    <div className="w-full">
      {/* ── Search Card ─────────────────────────────────────────── */}
      <div className={`relative rounded-[2rem] transition-all duration-500 ${
        isFocused || result
          ? "shadow-[0_20px_60px_rgba(0,0,0,0.18),0_0_0_1px_rgba(201,150,58,0.25)]"
          : "shadow-[0_8px_32px_rgba(0,0,0,0.10)]"
      }`}>
        {/* Glass background */}
        <div className="absolute inset-0 rounded-[2rem] bg-white/90 backdrop-blur-2xl" />

        {/* Gold shimmer border on focus */}
        <div className={`absolute inset-0 rounded-[2rem] transition-opacity duration-500 pointer-events-none ${
          isFocused ? "opacity-100" : "opacity-0"
        }`} style={{
          background: "linear-gradient(135deg, rgba(201,150,58,0.15), transparent 60%, rgba(201,150,58,0.10))",
        }} />

        <div className="relative p-6 sm:p-8">
          {/* Label row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-base transition-all duration-300 ${
                loading
                  ? "bg-[var(--gold)] animate-pulse"
                  : "bg-gradient-to-br from-[var(--gold-shine)] to-[var(--gold-dark)]"
              }`}>
                {loading ? "✦" : "✧"}
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--gold-dark)]">
                  AI Luxury Concierge
                </p>
                <p className="text-[10px] text-[var(--text-muted)] font-medium">
                  {loading ? "Analizando tu solicitud..." : "Descríbeme el viaje de tus sueños"}
                </p>
              </div>
            </div>
            {result && (
              <button
                onClick={handleReset}
                className="text-[10px] font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-all"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                Nueva búsqueda
              </button>
            )}
          </div>

          {/* Textarea */}
          <div className="relative mb-5">
            <textarea
              ref={textareaRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKey}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={loading}
              rows={3}
              placeholder={!isFocused && !query ? displayedSuggestion : "Ej: Quiero un spa de lujo frente al mar en Chile para este fin de semana..."}
              className={[
                "w-full bg-[var(--surface-2)] border rounded-2xl px-5 py-4 text-sm text-[var(--text-primary)]",
                "font-medium resize-none leading-relaxed placeholder:text-[var(--text-muted)] placeholder:font-light placeholder:italic",
                "focus:outline-none transition-all duration-300",
                isFocused
                  ? "border-[var(--gold)]/50 bg-white shadow-[0_0_0_3px_rgba(201,150,58,0.10)]"
                  : "border-[var(--border)] hover:border-[var(--gold)]/30",
                loading ? "opacity-50 cursor-not-allowed" : "",
              ].join(" ")}
            />
            {/* Character hint */}
            {isFocused && (
              <p className="absolute bottom-3 right-4 text-[10px] text-[var(--text-muted)] font-medium pointer-events-none">
                ↵ Enter para buscar
              </p>
            )}
          </div>

          {/* Action row */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSearch}
              disabled={loading || query.trim().length < 5}
              className={`flex items-center gap-2 px-7 py-3 rounded-2xl text-[12px] font-black tracking-[0.1em] uppercase transition-all duration-300 ${
                loading || query.trim().length < 5
                  ? "bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)] cursor-not-allowed"
                  : "btn-gold"
              }`}
            >
              {loading ? (
                <>
                  <ThinkingDots />
                  Pensando...
                </>
              ) : (
                <>
                  <span className="text-base">✦</span>
                  Buscar con IA
                </>
              )}
            </button>

            {/* Quick examples */}
            <div className="flex-1 hidden sm:flex flex-wrap gap-2">
              {[
                { label: "🧖 Spa & Relax", q: "Quiero un hotel con spa y masajes para relajarme" },
                { label: "💑 Romántico",    q: "Escapada romántica con cena gourmet para aniversario de bodas" },
                { label: "🏖️ Playa Lujo",   q: "Hotel de lujo frente al mar 5 estrellas sin límite de presupuesto" },
              ].map(ex => (
                <button
                  key={ex.label}
                  onClick={() => { setQuery(ex.q); textareaRef.current?.focus(); }}
                  disabled={loading}
                  className="text-[10px] font-bold text-[var(--text-secondary)] bg-[var(--surface-2)] hover:bg-[var(--gold-lighter)] hover:text-[var(--gold-dark)] border border-[var(--border)] hover:border-[var(--gold)]/30 px-3 py-1.5 rounded-xl transition-all duration-200"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Loading Overlay ──────────────────────────────────────── */}
        {loading && (
          <div className="absolute inset-0 rounded-[2rem] flex items-center justify-center bg-white/60 backdrop-blur-sm z-10">
            <ThinkingAnimation />
          </div>
        )}
      </div>

      {/* ── Error ───────────────────────────────────────────────── */}
      {error && (
        <div className="mt-4 px-5 py-3.5 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 font-medium animate-slide-up">
          ⚠ {error}
        </div>
      )}

      {/* ── Results ─────────────────────────────────────────────── */}
      {result && showResults && (
        <div className={`mt-6 transition-all duration-700 ${showResults ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          {/* AI Reasoning Card */}
          <div className="relative overflow-hidden rounded-3xl bg-[var(--text-primary)] text-white p-6 sm:p-8 mb-6 shadow-[var(--shadow-dark)]">
            {/* Background orb */}
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-[var(--gold)]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--gold)]/40 to-transparent" />

            <div className="relative z-10">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--gold-shine)] to-[var(--gold-dark)] flex items-center justify-center text-white text-lg shrink-0 shadow-[var(--shadow-gold)]">
                  ✦
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--gold)]">
                      Concierge IA · {result.usingAI ? "Gemini 1.5 Flash" : "Motor de Inteligencia"}
                    </p>
                    <span className="text-[10px] bg-[var(--gold)]/20 text-[var(--gold-shine)] border border-[var(--gold)]/25 px-2 py-0.5 rounded-full font-bold">
                      {result.hotels.length} hoteles encontrados
                    </span>
                  </div>
                  <p className="text-white/90 text-[15px] font-light leading-relaxed mb-4">
                    {result.reasoning}
                  </p>

                  {/* Highlights */}
                  {result.highlights.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {result.highlights.map(h => (
                        <span key={h} className="text-[10px] font-bold bg-white/10 border border-white/15 text-white/80 px-3 py-1.5 rounded-full">
                          {h}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Detected filters */}
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/10">
                    {result.detectedFilters.category && (
                      <FilterTag label={`Tipo: ${CAT_LABELS[result.detectedFilters.category] ?? result.detectedFilters.category}`} />
                    )}
                    {result.detectedFilters.experienceType && (
                      <FilterTag label={EXP_LABELS[result.detectedFilters.experienceType] ?? result.detectedFilters.experienceType} />
                    )}
                    {result.detectedFilters.minStars && (
                      <FilterTag label={`${"★".repeat(result.detectedFilters.minStars)}+`} />
                    )}
                    {result.detectedFilters.country && (
                      <FilterTag label={`📍 ${result.detectedFilters.country}`} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hotel results grid */}
          {result.hotels.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-[var(--border)] shadow-[var(--shadow-xs)]">
              <div className="w-16 h-16 rounded-full bg-[var(--surface-2)] flex items-center justify-center mx-auto mb-4 text-2xl">🔍</div>
              <p className="font-bold text-[var(--text-primary)] mb-1">No encontramos hoteles exactos</p>
              <p className="text-sm text-[var(--text-muted)] max-w-xs mx-auto">
                Intenta con una descripción diferente o menos restrictiva.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
              {/* First card gets the "AI Recommended" treatment */}
              {result.hotels.map((hotel, idx) => (
                <AIConciergeHotelCard
                  key={hotel.id}
                  hotel={hotel}
                  locale={locale}
                  isPrimary={idx === 0}
                  mood={idx === 0 ? result.mood : undefined}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ThinkingDots() {
  return (
    <span className="flex items-center gap-0.5">
      {[0,1,2].map(i => (
        <span key={i} className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </span>
  );
}

function ThinkingAnimation() {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Orbiting gold particles */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-2 border-[var(--gold)]/20 animate-spin-slow" />
        <div className="absolute inset-2 rounded-full border border-[var(--gold)]/40 animate-[spin_2s_linear_infinite_reverse]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl text-[var(--gold)] animate-pulse">✦</span>
        </div>
        {/* Orbiting dot */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-0.5 w-2 h-2 bg-[var(--gold)] rounded-full animate-spin-slow origin-[0_32px]" />
      </div>
      <div className="text-center">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--gold-dark)] mb-1">
          Concierge pensando
        </p>
        <p className="text-xs text-[var(--text-muted)] font-medium">Analizando tu solicitud...</p>
      </div>
    </div>
  );
}

function FilterTag({ label }: { label: string }) {
  return (
    <span className="text-[10px] font-bold text-white/60 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
      {label}
    </span>
  );
}

function AIConciergeHotelCard({ hotel, locale, isPrimary, mood }: {
  hotel: Hotel; locale: string; isPrimary?: boolean; mood?: string;
}) {
  const badgeClass = CAT_COLORS[hotel.category] ?? "bg-gray-100 text-gray-600 border-gray-200";
  const catLabel   = CAT_LABELS[hotel.category] ?? hotel.category;

  return (
    <a
      href={`/${locale}/hotels/${hotel.slug}`}
      className={`group block rounded-[1.75rem] overflow-hidden border shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-lg)] hover:-translate-y-2 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
        isPrimary
          ? "border-[var(--gold)]/40 bg-white shadow-[var(--shadow-md),0_0_0_1px_rgba(201,150,58,0.15)]"
          : "border-[var(--border)] bg-white"
      }`}
    >
      {/* Primary badge */}
      {isPrimary && mood && (
        <div className="bg-gradient-to-r from-[var(--gold-shine)] to-[var(--gold-dark)] px-5 py-2.5 text-white flex items-center gap-2">
          <span className="text-xs font-black tracking-wide">✦ RECOMENDACIÓN PERFECTA</span>
          <span className="text-white/70 text-[10px] font-medium ml-auto truncate">{mood}</span>
        </div>
      )}

      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-[var(--surface-2)]">
        {hotel.images?.[0]?.url ? (
          <img
            src={hotel.images[0].url}
            alt={hotel.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl opacity-10 bg-gradient-to-br from-[var(--surface-2)] to-[var(--border)]">🏨</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent opacity-60 group-hover:opacity-75 transition-opacity duration-500" />

        {/* Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border backdrop-blur-md ${badgeClass} bg-opacity-90`}>
            {catLabel}
          </span>
          {(hotel.avgRating || hotel.starRating) && (
            <div className="glass-dark rounded-full px-2.5 py-1 flex items-center gap-1">
              <span className="text-[var(--gold-shine)] text-xs">★</span>
              <span className="text-[11px] font-bold text-white">{hotel.avgRating ?? hotel.starRating}</span>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        <h3 className="text-[15px] font-bold text-[var(--text-primary)] group-hover:text-[var(--gold-dark)] transition-colors line-clamp-1 mb-1">
          {hotel.name}
        </h3>
        <p className="text-xs text-[var(--text-muted)] font-medium flex items-center gap-1 mb-4">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          {hotel.locationCity}, {hotel.locationCountry}
        </p>

        <div className="flex items-center justify-between pt-3.5 border-t border-[var(--border-soft)]">
          <div>
            {hotel.minPricePerNight ? (
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-black text-[var(--text-primary)]">${hotel.minPricePerNight.toLocaleString("es-CL")}</span>
                <span className="text-[10px] text-[var(--text-muted)]">/ noche</span>
              </div>
            ) : (
              <span className="text-sm text-[var(--text-muted)] font-medium">Consultar precio</span>
            )}
          </div>
          <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110 ${
            isPrimary
              ? "bg-[var(--gold)] group-hover:shadow-[var(--shadow-gold)]"
              : "bg-[var(--text-primary)] group-hover:bg-[var(--gold)] group-hover:shadow-[var(--shadow-gold)]"
          }`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </div>
        </div>
      </div>
    </a>
  );
}
