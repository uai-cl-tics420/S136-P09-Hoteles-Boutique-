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
    <div className={`bg-white rounded-2xl border border-gray-100 p-4 mb-6 transition-opacity ${isPending ? "opacity-60 pointer-events-none" : ""}`}>
      {/* Barra de búsqueda */}
      <div className="flex gap-2 mb-4">
        <input
          defaultValue={search}
          onKeyDown={(e) => {
            if (e.key === "Enter") applyFilters({ city: (e.target as HTMLInputElement).value });
          }}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          placeholder="Ciudad o nombre del hotel..."
        />
        <button
          onClick={(e) => {
            const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
            applyFilters({ city: input?.value ?? "" });
          }}
          className="bg-gray-900 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          Buscar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Categoría</label>
          <select
            defaultValue={category}
            onChange={(e) => applyFilters({ category: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="">Todas</option>
            {Object.entries(CAT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">Precio máximo/noche</label>
          <select
            defaultValue={maxPrice}
            onChange={(e) => applyFilters({ maxPrice: e.target.value })}
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
            defaultValue={minStars}
            onChange={(e) => applyFilters({ minStars: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="">Cualquiera</option>
            <option value="3">3+ estrellas</option>
            <option value="4">4+ estrellas</option>
            <option value="5">5 estrellas</option>
          </select>
        </div>
        {(category || maxPrice || minStars || search) && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-400 hover:text-gray-700 px-2 py-2"
          >
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}
