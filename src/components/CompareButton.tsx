"use client";
import { useState, useEffect } from "react";

const STORAGE_KEY = "hb_compare";
const MAX_COMPARE = 3;

export interface CompareItem {
  id: string;
  slug: string;
  name: string;
  category: string;
  starRating: number;
  locationCity: string;
  minPricePerNight: number | null;
  imageUrl?: string;
}

export function getCompareList(): CompareItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function toggleCompare(item: CompareItem): { added: boolean; full: boolean } {
  const list = getCompareList();
  const idx = list.findIndex((h) => h.id === item.id);
  if (idx !== -1) {
    list.splice(idx, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("hb:compare-changed"));
    return { added: false, full: false };
  }
  if (list.length >= MAX_COMPARE) {
    return { added: false, full: true };
  }
  list.push(item);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("hb:compare-changed"));
  return { added: true, full: false };
}

interface Props {
  hotel: CompareItem;
}

export default function CompareButton({ hotel }: Props) {
  const [inList, setInList] = useState(false);
  const [full, setFull] = useState(false);

  useEffect(() => {
    const update = () => {
      const list = getCompareList();
      setInList(list.some((h) => h.id === hotel.id));
      setFull(list.length >= MAX_COMPARE && !list.some((h) => h.id === hotel.id));
    };
    update();
    window.addEventListener("hb:compare-changed", update);
    return () => window.removeEventListener("hb:compare-changed", update);
  }, [hotel.id]);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const result = toggleCompare(hotel);
    setInList(result.added);
    if (result.full) {
      // feedback visual
      const el = e.currentTarget as HTMLButtonElement;
      el.classList.add("animate-bounce");
      setTimeout(() => el.classList.remove("animate-bounce"), 600);
    }
  }

  if (full) {
    return (
      <button
        disabled
        className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border border-[var(--border)] text-[var(--text-muted)] bg-[var(--surface)] opacity-50 cursor-not-allowed"
      >
        Máx. 3
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      title={inList ? "Quitar del comparador" : "Añadir al comparador"}
      className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border transition-all duration-200 ${
        inList
          ? "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
          : "bg-white/80 text-[var(--text-muted)] border-[var(--border)] hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50"
      }`}
    >
      {inList ? "✓ Comparando" : "+ Comparar"}
    </button>
  );
}
