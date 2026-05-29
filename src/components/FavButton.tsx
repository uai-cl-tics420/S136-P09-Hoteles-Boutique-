"use client";
import { useState, useEffect } from "react";

const STORAGE_KEY = "hb_favorites";

export function getFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function toggleFavorite(hotelId: string): boolean {
  const favs = getFavorites();
  const idx = favs.indexOf(hotelId);
  if (idx === -1) {
    favs.push(hotelId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
    window.dispatchEvent(new CustomEvent("hb:favorites-changed"));
    return true;
  } else {
    favs.splice(idx, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
    window.dispatchEvent(new CustomEvent("hb:favorites-changed"));
    return false;
  }
}

interface Props {
  hotelId: string;
  hotelSlug: string;
  hotelName: string;
  size?: "sm" | "md";
}

export default function FavButton({ hotelId, hotelSlug, hotelName, size = "md" }: Props) {
  const [isFav, setIsFav] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    setIsFav(getFavorites().includes(hotelId));
    const handler = () => setIsFav(getFavorites().includes(hotelId));
    window.addEventListener("hb:favorites-changed", handler);
    return () => window.removeEventListener("hb:favorites-changed", handler);
  }, [hotelId]);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const added = toggleFavorite(hotelId);
    setIsFav(added);
    setPulse(true);
    setTimeout(() => setPulse(false), 400);
  }

  const sizeClass = size === "sm"
    ? "w-7 h-7 text-sm"
    : "w-9 h-9 text-base";

  return (
    <button
      onClick={handleClick}
      aria-label={isFav ? `Quitar ${hotelName} de favoritos` : `Guardar ${hotelName} en favoritos`}
      title={isFav ? "Quitar de favoritos" : "Añadir a favoritos"}
      className={`
        ${sizeClass} rounded-full flex items-center justify-center transition-all duration-300
        ${isFav
          ? "bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 shadow-sm"
          : "bg-white/80 backdrop-blur-sm text-[var(--text-muted)] border border-[var(--border)] hover:text-red-400 hover:border-red-200 hover:bg-red-50"
        }
        ${pulse ? "scale-125" : "scale-100"}
      `}
    >
      {isFav ? "♥" : "♡"}
    </button>
  );
}
