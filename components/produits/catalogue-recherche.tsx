"use client";

import { useMemo, useState } from "react";
import { Search, ArrowUpDown } from "lucide-react";
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
  createdAt: string;
  stockTotal: number;
}

type TriValeur = "nom" | "date_recent" | "date_ancien" | "stock";

const OPTIONS_TRI: { value: TriValeur; label: string }[] = [
  { value: "nom", label: "Alphabétique (A → Z)" },
  { value: "date_recent", label: "Date d'ajout (récent → ancien)" },
  { value: "date_ancien", label: "Date d'ajout (ancien → récent)" },
  { value: "stock", label: "Stock (élevé → faible)" },
];

export function CatalogueRecherche({
  produits,
  categories,
  hrefPrefix = "/catalogue",
  hrefSuffix = "",
  favoris = true,
}: {
  produits: ProduitPourRecherche[];
  categories: { id: string; nom: string }[];
  /** Préfixe du lien de chaque carte — "/catalogue" côté commercial (fiche
   * produit), "/admin/produits" côté admin (page de modification). */
  hrefPrefix?: string;
  /** Ajouté après l'id — "/edit" côté admin, vide côté commercial. */
  hrefSuffix?: string;
  /** Le cœur favoris n'a de sens que côté commercial. */
  favoris?: boolean;
}) {
  const [recherche, setRecherche] = useState("");
  const [categorieId, setCategorieId] = useState("toutes");
  const [disponibiliteSeulement, setDisponibiliteSeulement] = useState(false);
  const [tri, setTri] = useState<TriValeur>("nom");

  const resultats = useMemo(() => {
    const termeRecherche = recherche.trim().toLowerCase();

    return produits
      .filter((p) => {
        if (termeRecherche && !p.nom.toLowerCase().includes(termeRecherche)) return false;
        if (categorieId !== "toutes" && p.categoryId !== categorieId) return false;
        if (disponibiliteSeulement && (!p.disponible || !p.actif)) return false;
        return true;
      })
      .sort((a, b) => {
        // Les produits désactivés sont toujours relégués en fin de liste,
        // quel que soit le tri choisi par ailleurs.
        if (a.actif !== b.actif) return a.actif ? -1 : 1;

        switch (tri) {
          case "date_recent":
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case "date_ancien":
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case "stock":
            return b.stockTotal - a.stockTotal;
          case "nom":
          default:
            return a.nom.localeCompare(b.nom, "fr");
        }
      });
  }, [produits, recherche, categorieId, disponibiliteSeulement, tri]);

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

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-ink-900/50">
          {resultats.length} produit{resultats.length !== 1 ? "s" : ""} trouvé{resultats.length !== 1 ? "s" : ""}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-ink-900/70">
            <input
              type="checkbox"
              checked={disponibiliteSeulement}
              onChange={(e) => setDisponibiliteSeulement(e.target.checked)}
            />
            En stock uniquement
          </label>
          <div className="relative">
            <ArrowUpDown size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-900/40" />
            <select
              value={tri}
              onChange={(e) => setTri(e.target.value as TriValeur)}
              className="h-9 rounded-lg border border-ink-900/10 bg-surface py-1 pl-7 pr-2 text-xs"
              aria-label="Trier par"
            >
              {OPTIONS_TRI.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
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
                href={`${hrefPrefix}/${p.id}${hrefSuffix}`}
                disponible={p.disponible}
                actif={p.actif}
                nouveau={p.nouveau}
                favoris={favoris}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
