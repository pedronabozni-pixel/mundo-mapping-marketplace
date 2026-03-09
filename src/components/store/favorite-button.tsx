"use client";

import { useEffect, useState } from "react";
import { isFavorite, toggleFavorite } from "@/lib/favorites";

export function FavoriteButton({ slug }: { slug: string }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(isFavorite(slug));
  }, [slug]);

  return (
    <button
      aria-label="Adicionar aos favoritos"
      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
        active
          ? "border-amber-400 bg-amber-400/20 text-amber-300"
          : "border-zinc-700 bg-zinc-900/60 text-zinc-200 hover:border-amber-400/70"
      }`}
      onClick={() => {
        const next = toggleFavorite(slug);
        setActive(next.includes(slug));
      }}
      type="button"
    >
      {active ? "Favorito" : "Favoritar"}
    </button>
  );
}
