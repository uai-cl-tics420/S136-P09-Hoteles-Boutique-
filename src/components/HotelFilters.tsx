"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

const CAT_LABELS: Record<string, string> = {
  LUXURY: "Lujo", BOUTIQUE: "Boutique", ECO: "Eco",
  BEACH: "Playa", MOUNTAIN: "Montaña", CITY: "Ciudad",
};

export default function HotelFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const search   = params.get("city") ?? "";
  const category = params.get("category") ?? "";
  const maxPrice = params.get("maxPrice") ?? "";
  const minStars = params.get("minStars") ?? "";

  const applyFilters = useCallback(
    (overrides: Record<string, string>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(overrides)) {
        if (v) next.set(k, v);
        else next.delete(k);
      }
      startTransition(() => router.push(`?${next.toString()}`));
    },
    [params, router]
  );

  function clearFilters() {
    startTransition(() => router.push("?"));
  }

  return (
    <div className={`bg-white rounded-3xl border border-gray-100 p-6 mb-12 shadow-sm transition-opacity duration-300 ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
      {/* Barra de búsqueda principal */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
          <input
            defaultValue={search}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyFilters({ city: (e.target as HTMLInputElement).value });
            }}
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all"
            placeholder="¿A dónde quieres ir? Ciudad o nombre del hotel..."
          />
        </div>
        <button
          onClick={(e) => {
            const input = (e.currentTarget.previousElementSibling?.querySelector("input") as HTMLInputElement);
            applyFilters({ city: input?.value ?? "" });
          }}
          className="bg-gray-900 text-white rounded-2xl px-8 py-3.5 text-sm font-semibold hover:bg-gray-800 transition-all shadow-md hover:shadow-lg"
        >
          Buscar
        </button>
      </div>

      {/* Filtros secundarios */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Categoría</label>
          <select
            defaultValue={category}
            onChange={(e) => applyFilters({ category: e.target.value })}
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all cursor-pointer appearance-none"
          >
            <option value="">Todas las categorías</option>
            {Object.entries(CAT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Precio máximo</label>
          <select
            defaultValue={maxPrice}
            onChange={(e) => applyFilters({ maxPrice: e.target.value })}
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all cursor-pointer appearance-none"
          >
            <option value="">Cualquier precio</option>
            <option value="100">Hasta $100 / noche</option>
            <option value="200">Hasta $200 / noche</option>
            <option value="350">Hasta $350 / noche</option>
            <option value="500">Hasta $500 / noche</option>
          </select>
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Calificación</label>
          <select
            defaultValue={minStars}
            onChange={(e) => applyFilters({ minStars: e.target.value })}
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all cursor-pointer appearance-none"
          >
            <option value="">Todas las estrellas</option>
            <option value="3">3+ estrellas</option>
            <option value="4">4+ estrellas</option>
            <option value="5">5 estrellas (Lujo)</option>
          </select>
        </div>
        
        {(category || maxPrice || minStars || search) && (
          <button
            onClick={clearFilters}
            className="text-sm font-medium text-red-500 hover:text-red-600 px-4 py-2.5 rounded-xl hover:bg-red-50 transition-colors"
          >
            Borrar filtros
          </button>
        )}
      </div>
    </div>
  );
}
