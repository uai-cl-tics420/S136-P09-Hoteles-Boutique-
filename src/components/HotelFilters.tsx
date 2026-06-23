"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition, useState, useEffect } from "react";
import { loadTranslations } from "@/i18n/i18n-util";

const CATEGORIES = [
  { value: "LUXURY",   label: "Lujo",     icon: "💎" },
  { value: "BOUTIQUE", label: "Boutique", icon: "🌸" },
  { value: "ECO",      label: "Eco",      icon: "🌿" },
  { value: "BEACH",    label: "Playa",    icon: "🏖️" },
  { value: "MOUNTAIN", label: "Montaña",  icon: "🏔️" },
  { value: "CITY",     label: "Ciudad",   icon: "🏙️" },
];

const EXPERIENCES = [
  { value: "SPA",        label: "Spa & Bienestar", icon: "🧖" },
  { value: "DINING",     label: "Gastronomía",     icon: "🍽️" },
  { value: "TRANSPORT",  label: "Transporte",      icon: "🚗" },
  { value: "EXPERIENCE", label: "Experiencias",    icon: "🎭" },
];

const COUNTRIES = [
  { value: "Chile", label: "Chile", icon: "🇨🇱" },
  { value: "Argentina", label: "Argentina", icon: "🇦🇷" },
  { value: "Perú", label: "Perú", icon: "🇵🇪" },
];

const SELECT_CLASS = [
  "w-full bg-white/70 backdrop-blur-md border border-white/50 rounded-xl px-4 py-2.5",
  "text-sm font-medium text-[var(--text-primary)] shadow-sm hover:shadow-md",
  "focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/30 focus:border-[var(--gold)]",
  "transition-all duration-300 cursor-pointer appearance-none hover:bg-white hover:border-[var(--gold)]/40",
].join(" ");

export default function HotelFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [t, setT] = useState<any>(null);
  const pathname = usePathname() || "";
  const locale = pathname.split("/")[1] || "es";

  useEffect(() => {
    loadTranslations(locale as any).then(setT);
  }, [locale]);

  // Estado local de la barra de búsqueda para reflejar el valor actual
  const [inputValue, setInputValue] = useState(params.get("query") ?? "");

  const category = params.get("category") ?? "";
  const maxPrice = params.get("maxPrice") ?? "";
  const minStars = params.get("minStars") ?? "";
  const experience = params.get("experience") ?? "";
  const country = params.get("country") ?? "";
  const hasFilters = !!(params.get("query") || category || maxPrice || minStars || experience || country);

  // Sync input cuando los params cambien (ej. al borrar filtros)
  useEffect(() => {
    setInputValue(params.get("query") ?? "");
  }, [params]);

  const applyFilters = useCallback(
    (overrides: Record<string, string>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(overrides)) {
        if (v) next.set(k, v);
        else next.delete(k);
      }
      // Reset page on filter change
      next.delete("page");
      startTransition(() => router.push(`?${next.toString()}`, { scroll: false }));
    },
    [params, router]
  );

  function clearFilters() {
    setInputValue("");
    startTransition(() => router.push("?", { scroll: false }));
  }

  function handleSearch() {
    applyFilters({ query: inputValue });
  }

  if (!t) return null;

  return (
    <div
      className={[
        "relative z-20 rounded-3xl border border-white/40 bg-white/50 backdrop-blur-2xl p-7 mb-12",
        "shadow-[0_8px_40px_rgb(0,0,0,0.06)] hover:shadow-[0_12px_50px_rgb(0,0,0,0.08)] transition-all duration-500",
        "animate-slide-up",
        isPending ? "opacity-60 pointer-events-none scale-[0.995]" : "",
      ].join(" ")}
    >
      {/* Barra de búsqueda */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none select-none">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </span>
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
            className={[
              "w-full bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl",
              "pl-12 pr-4 py-3.5 text-sm font-medium text-[var(--text-primary)] shadow-sm hover:shadow-md hover:bg-white",
              "placeholder:text-[var(--text-muted)]",
              "focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40 focus:border-[var(--gold)]",
              "transition-all duration-300",
            ].join(" ")}
            placeholder={t("hotels.results.searchPlaceholder")}
          />
        </div>
        <button
          onClick={handleSearch}
          className={[
            "bg-gradient-to-r from-[var(--gold)] to-[var(--gold-dark)] text-white rounded-2xl px-8 py-3.5 text-sm font-bold tracking-wide shadow-md",
            "hover:shadow-[0_8px_20px_rgba(234,179,8,0.3)] hover:-translate-y-0.5",
            "active:scale-95 transition-all duration-300 whitespace-nowrap",
          ].join(" ")}
        >
          {t("hotels.search")}
        </button>
      </div>

      {/* Filtros secundarios */}
      <div className="flex flex-wrap gap-4 items-end">
        {/* Categoría */}
        <div className="flex-1 min-w-[160px]">
          <label className="block text-[9px] font-black text-[var(--gold-dark)] mb-2 uppercase tracking-[0.15em] ml-1">
            {t("hotels.category")}
          </label>
          <div className="relative">
            <select
              value={category}
              onChange={(e) => applyFilters({ category: e.target.value })}
              className={SELECT_CLASS}
            >
              <option value="">{t("hotels.results.allCategories")}</option>
              {CATEGORIES.map(({ value, label, icon }) => (
                <option key={value} value={value}>{icon} {label}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m6 9 6 6 6-6"/></svg>
            </span>
          </div>
        </div>

        {/* País */}
        <div className="flex-1 min-w-[160px]">
          <label className="block text-[9px] font-black text-[var(--gold-dark)] mb-2 uppercase tracking-[0.15em] ml-1">
            {t("hotels.country")}
          </label>
          <div className="relative">
            <select
              value={country}
              onChange={(e) => applyFilters({ country: e.target.value })}
              className={SELECT_CLASS}
            >
              <option value="">{t("hotels.anyCountry")}</option>
              {COUNTRIES.map(({ value, label, icon }) => (
                <option key={value} value={value}>{icon} {label}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m6 9 6 6 6-6"/></svg>
            </span>
          </div>
        </div>

        {/* Precio máximo */}
        <div className="flex-1 min-w-[160px]">
          <label className="block text-[9px] font-black text-[var(--gold-dark)] mb-2 uppercase tracking-[0.15em] ml-1">
            {t("hotels.priceRange")}
          </label>
          <div className="relative">
            <select
              value={maxPrice}
              onChange={(e) => applyFilters({ maxPrice: e.target.value })}
              className={SELECT_CLASS}
            >
              <option value="">{t("hotels.results.anyPrice")}</option>
              <option value="150000">{t("hotels.results.upTo")} $150.000</option>
              <option value="300000">{t("hotels.results.upTo")} $300.000</option>
              <option value="500000">{t("hotels.results.upTo")} $500.000</option>
              <option value="800000">{t("hotels.results.upTo")} $800.000</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m6 9 6 6 6-6"/></svg>
            </span>
          </div>
        </div>

        {/* Experiencia */}
        <div className="flex-1 min-w-[160px]">
          <label className="block text-[9px] font-black text-[var(--gold-dark)] mb-2 uppercase tracking-[0.15em] ml-1">
            {t("hotels.experienceType")}
          </label>
          <div className="relative">
            <select
              value={experience}
              onChange={(e) => applyFilters({ experience: e.target.value })}
              className={SELECT_CLASS}
            >
              <option value="">{t("hotels.results.allExperiences")}</option>
              {EXPERIENCES.map(({ value, label, icon }) => (
                <option key={value} value={value}>{icon} {label}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m6 9 6 6 6-6"/></svg>
            </span>
          </div>
        </div>

        {/* Estrellas */}
        <div className="flex-1 min-w-[160px]">
          <label className="block text-[9px] font-black text-[var(--gold-dark)] mb-2 uppercase tracking-[0.15em] ml-1">
            {t("hotels.minStars")}
          </label>
          <div className="relative">
            <select
              value={minStars}
              onChange={(e) => applyFilters({ minStars: e.target.value })}
              className={SELECT_CLASS}
            >
              <option value="">{t("hotels.results.anyRating")}</option>
              <option value="3">⭐⭐⭐ 3 {t("hotels.results.starsPlus")}</option>
              <option value="4">⭐⭐⭐⭐ 4 {t("hotels.results.starsPlus")}</option>
              <option value="5">⭐⭐⭐⭐⭐ {t("hotels.results.only5Stars")}</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m6 9 6 6 6-6"/></svg>
            </span>
          </div>
        </div>

        {/* Limpiar */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className={[
              "flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest",
              "text-[var(--text-muted)] hover:text-red-500",
              "px-5 py-2.5 rounded-xl hover:bg-red-50/50 border border-transparent hover:border-red-100",
              "transition-all duration-300 mt-5",
            ].join(" ")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            {t("hotels.results.clear")}
          </button>
        )}
      </div>

      {/* Chips de filtros activos */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[var(--border)]">
          <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-bold self-center mr-1">{t("hotels.results.active")}</span>
          {params.get("query") && (
            <Chip label={`${t("hotels.search")}: ${params.get("query")}`} onRemove={() => applyFilters({ query: "" })} />
          )}
          {category && (
            <Chip label={`Cat: ${CATEGORIES.find(c => c.value === category)?.label}`} onRemove={() => applyFilters({ category: "" })} />
          )}
          {country && (
            <Chip label={`País: ${country}`} onRemove={() => applyFilters({ country: "" })} />
          )}
          {maxPrice && (
            <Chip label={`Máx: $${Number(maxPrice).toLocaleString("es-CL")}`} onRemove={() => applyFilters({ maxPrice: "" })} />
          )}
          {minStars && (
            <Chip label={`${minStars}+ ⭐`} onRemove={() => applyFilters({ minStars: "" })} />
          )}
          {experience && (
            <Chip label={`Exp: ${EXPERIENCES.find(e => e.value === experience)?.label}`} onRemove={() => applyFilters({ experience: "" })} />
          )}
        </div>
      )}

      {/* Loading bar */}
      {isPending && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full overflow-hidden">
          <div className="h-full bg-[var(--gold)] animate-pulse" />
        </div>
      )}
    </div>
  );
}

function Chip({ label, onRemove }: { label?: string; onRemove: () => void }) {
  if (!label) return null;
  return (
    <span className="inline-flex items-center gap-1.5 bg-[var(--gold-light)] text-[var(--gold-dark)] text-xs font-semibold px-3 py-1 rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-red-500 transition-colors leading-none">×</button>
    </span>
  );
}
