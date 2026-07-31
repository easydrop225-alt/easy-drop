"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "./product-card";
import { Input } from "@/components/ui/input";

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
  prixFournisseur: number;
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
  const [prixMax, setPrixMax] = useState("");

  const filtreActif =
    recherche.trim() !== "" || categorieId !== "toutes" || disponibiliteSeulement || prixMax !== "";

  const resultats = useMemo(() => {
    const termeRecherche = recherche.trim().toLowerCase();
    const plafondPrix = prixMax !== "" ? Number(prixMax) : null;

    return produits.filter((p) => {
      if (termeRecherche && !p.nom.toLowerCase().includes(termeRecherche)) return false;
      if (categorieId !== "toutes" && p.categoryId !== categorieId) return false;
      if (disponibiliteSeulement && !p.disponible) return false;
      if (plafondPrix != null && p.prixMinConseille != null && p.prixMinConseille > plafondPrix) return false;
      return true;
    });
  }, [produits, recherche, categorieId, disponibiliteSeulement, prixMax]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un produit par nom..."
          className="sm:max-w-xs"
        />
        <select
          value={categorieId}
          onChange={(e) => setCategorieId(e.target.value)}
          className="h-10 rounded-xl border border-ink-900/10 bg-surface px-3 text-sm"
        >
          <option value="toutes">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.nom}</option>
          ))}
        </select>
        <Input
          type="number"
          min={0}
          value={prixMax}
          onChange={(e) => setPrixMax(e.target.value)}
          placeholder="Prix conseillé max"
          className="sm:max-w-[160px]"
        />
        <label className="flex items-center gap-2 text-sm text-ink-900/70">
          <input
            type="checkbox"
            checked={disponibiliteSeulement}
            onChange={(e) => setDisponibiliteSeulement(e.target.checked)}
          />
          En stock uniquement
        </label>
      </div>

      {filtreActif && (
        <div className="mt-6">
          <p className="mb-3 text-sm text-ink-900/50">
            {resultats.length} produit{resultats.length !== 1 ? "s" : ""} trouvé{resultats.length !== 1 ? "s" : ""}
          </p>
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
                  }}
                  prixFournisseur={p.prixFournisseur}
                  imageUrl={p.imageUrl}
                  href={`/catalogue/${p.id}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
