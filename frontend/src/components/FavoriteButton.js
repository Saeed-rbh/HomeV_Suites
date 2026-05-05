"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";

const STORAGE_KEY = "homev_favorites";

function getFavorites() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export default function FavoriteButton({ id, className = "" }) {
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    setIsFavorited(getFavorites().includes(id));
  }, [id]);

  const toggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const favorites = getFavorites();
    let next;
    if (favorites.includes(id)) {
      next = favorites.filter((f) => f !== id);
    } else {
      next = [...favorites, id];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setIsFavorited(next.includes(id));
  };

  return (
    <button
      onClick={toggle}
      aria-label={isFavorited ? "Remove from wishlist" : "Save to wishlist"}
      className={`group flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow-md backdrop-blur-sm transition hover:scale-110 hover:bg-white ${className}`}
    >
      <Heart
        className={`h-4 w-4 transition ${
          isFavorited
            ? "fill-[#0c1929] text-[#0c1929]"
            : "fill-transparent text-[#0c1929] group-hover:text-[#0c1929]"
        }`}
      />
    </button>
  );
}
