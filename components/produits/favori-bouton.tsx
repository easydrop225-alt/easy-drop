"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

const CLE_FAVORIS = "easydrop_favoris";

function lireFavoris(): Set<string> {
  try {
    const brut = window.localStorage.getItem(CLE_FAVORIS);
    return new Set(brut ? (JSON.parse(brut) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function FavoriBouton({ productId }: { productId: string }) {
  const [favori, setFavori] = useState(false);

  useEffect(() => {
    setFavori(lireFavoris().has(productId));
  }, [productId]);

  function basculer(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const favoris = lireFavoris();
    const nouveauFavori = !favoris.has(productId);
    if (nouveauFavori) favoris.add(productId);
    else favoris.delete(productId);
    try {
      window.localStorage.setItem(CLE_FAVORIS, JSON.stringify(Array.from(favoris)));
    } catch {
      // Stockage indisponible : le cœur reste juste visuel pour cette session.
    }
    setFavori(nouveauFavori);
  }

  return (
    <button
      type="button"
      onClick={basculer}
      aria-label={favori ? "Retirer des favoris" : "Ajouter aux favoris"}
      className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-surface/90 shadow-sm transition hover:scale-105"
    >
      <Heart size={16} className={favori ? "fill-terracotta-500 text-terracotta-500" : "text-ink-900/40"} />
    </button>
  );
}
