"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ProductCard } from "./product-card";

export interface ProduitPourRecherche {
  id: string;
  nom: string;
  slug: string;
  categoryId: string | null;
  categoryNom: string | null;
  prixMinConseille: number | null;
  prixMaxConseille: number | null;
  imageUrl?: string;
  disponible: boolean;
  actif: boolean;
  nouveau: boolean;
  prixFournisseur: number;
  couleurs?: string[];
  tailles?: string[];
}

export function CatalogueRecherche({
  produits,
  categories,
}: {
  produits: ProduitPourRecherche[];
  categories: { id: string; nom: string }[];
}) {
  const [recherche, setRecherche] = useState("");
  const [categorieId, setCategorieId] = useState("toutes");
  const [disponibiliteSeulement, setDisponibiliteSeulement] = useState(false);

  const resultats = useMemo(() => {
    const termeRecherche = recherche.trim().toLowerCase();

    return produits
      .filter((p) => {
        if (termeRecherche && !p.nom.toLowerCase().includes(termeRecherche)) return false;
        if (categorieId !== "toutes" && p.categoryId !== categorieId) return false;
        if (disponibiliteSeulement && (!p.disponible || !p.actif)) return false;
        return true;
      })
      // Les produits désactivés par l'admin sont relégués en fin de liste,
      // plutôt que mélangés au reste selon l'ordre alphabétique.
      .sort((a, b) => {
        if (a.actif !== b.actif) return a.actif ? -1 : 1;
        return 0;
      });
  }, [produits, recherche, categorieId, disponibiliteSeulement]);

  return (
    <div>
      {/* Barre de recherche — navigation supérieure du catalogue */}
      <div className="relative">
        <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-900/30" />
        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un produit..."
          className="h-11 w-full rounded-xl border border-ink-900/10 bg-surface pl-10 pr-3 text-sm"
        />
      </div>

      {/* Catégories — pastilles défilables horizontalement */}
      {categories.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setCategorieId("toutes")}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
              categorieId === "toutes" ? "bg-terracotta-500 text-white" : "bg-beige-100 text-ink-900/70"
            }`}
          >
            Tous
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategorieId(c.id)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                categorieId === c.id ? "bg-terracotta-500 text-white" : "bg-beige-100 text-ink-900/70"
              }`}
            >
              {c.nom}
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <p className="text-sm text-ink-900/50">
          {resultats.length} produit{resultats.length !== 1 ? "s" : ""} trouvé{resultats.length !== 1 ? "s" : ""}
        </p>
        <label className="flex items-center gap-2 text-sm text-ink-900/70">
          <input
            type="checkbox"
            checked={disponibiliteSeulement}
            onChange={(e) => setDisponibiliteSeulement(e.target.checked)}
          />
          En stock uniquement
        </label>
      </div>

      <div className="mt-4">
        {resultats.length === 0 ? (
          <p className="text-sm text-ink-900/50">Aucun produit ne correspond à cette recherche.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {resultats.map((p) => (
              <ProductCard
                key={p.id}
                product={{
                  id: p.id,
                  nom: p.nom,
                  slug: p.slug,
                  prix_min_conseille: p.prixMinConseille,
                  prix_max_conseille: p.prixMaxConseille,
                  couleurs: p.couleurs,
                  tailles: p.tailles,
                }}
                prixFournisseur={p.prixFournisseur}
                imageUrl={p.imageUrl}
                href={`/catalogue/${p.id}`}
                disponible={p.disponible}
                actif={p.actif}
                nouveau={p.nouveau}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
