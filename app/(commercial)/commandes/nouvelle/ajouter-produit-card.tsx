"use client";

import { useState } from "react";
import Image from "next/image";
import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { formatFCFA } from "@/lib/utils";
import type { VariantAvecStock } from "./use-panier-commande";
import type { Product } from "@/types/database";

/**
 * Affichage pur de la zone de saisie du produit en cours d'ajout (pas encore
 * dans le panier) : choix du produit, quantités par variante, prix de vente
 * et bénéfice associé. Toute la logique (calculs, état du panier) reste dans
 * usePanierCommande — ce composant ne fait que rendre ce qu'on lui donne.
 */
export function AjouterProduitCard({
  panierNonVide,
  productsDisponibles,
  stagingProductId,
  onSelectionnerProduit,
  stagingVariantes,
  stagingQuantites,
  onQuantiteChange,
  modeTarification,
  stagingPrixVente,
  onPrixVenteChange,
  stagingQuantiteTotale,
  stagingBenefice,
  stagingProduit,
  stagingHorsFourchette,
  onAjouter,
  imageParVariante,
  imageParProduit,
  observation,
  onObservationChange,
}: {
  panierNonVide: boolean;
  productsDisponibles: Product[];
  stagingProductId: string;
  onSelectionnerProduit: (id: string) => void;
  stagingVariantes: VariantAvecStock[];
  stagingQuantites: Record<string, number>;
  onQuantiteChange: (cle: string, valeur: number) => void;
  modeTarification: "parProduit" | "total";
  stagingPrixVente: number;
  onPrixVenteChange: (valeur: number) => void;
  stagingQuantiteTotale: number;
  stagingBenefice: number;
  stagingProduit: Product | undefined;
  stagingHorsFourchette: boolean;
  onAjouter: () => void;
  imageParVariante?: Record<string, string>;
  imageParProduit?: Record<string, string>;
  observation: string;
  onObservationChange: (valeur: string) => void;
}) {
  const [rechercheProduit, setRechercheProduit] = useState("");
  const [listeOuverte, setListeOuverte] = useState(false);

  const produitsFiltres = productsDisponibles.filter((p) =>
    p.nom.toLowerCase().includes(rechercheProduit.trim().toLowerCase())
  );

  function choisir(id: string) {
    onSelectionnerProduit(id);
    setListeOuverte(false);
    setRechercheProduit("");
  }
  return (
    <Card>
      <h2 className="mb-4 font-medium">{panierNonVide ? "Ajouter un autre produit" : "Produit"}</h2>

      {productsDisponibles.length === 0 ? (
        <p className="text-sm text-ink-900/50">Tous les produits actifs sont déjà dans cette commande.</p>
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <Label htmlFor="rechercheProduitInput">Produit</Label>
            <Input
              id="rechercheProduitInput"
              value={listeOuverte ? rechercheProduit : (stagingProduit?.nom ?? "")}
              onChange={(e) => { setRechercheProduit(e.target.value); setListeOuverte(true); }}
              onFocus={() => { setListeOuverte(true); setRechercheProduit(""); }}
              onBlur={() => { setTimeout(() => setListeOuverte(false), 150); }}
              placeholder="Rechercher un produit par son nom..."
              autoComplete="off"
            />
            {listeOuverte && (
              <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-ink-900/10 bg-surface shadow-lg">
                {produitsFiltres.length === 0 && (
                  <p className="p-3 text-sm text-ink-900/50">Aucun produit ne correspond.</p>
                )}
                {produitsFiltres.map((p) => {
                  const photoProduit = imageParProduit?.[p.id];
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => choisir(p.id)}
                      className="flex w-full items-center gap-3 p-2.5 text-left hover:bg-beige-100"
                    >
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-beige-100">
                        {photoProduit ? (
                          <Image src={photoProduit} alt="" fill sizes="40px" className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-ink-900/30">📦</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{p.nom}</p>
                        <p className="text-xs text-ink-900/50">{formatFCFA(p.prix_fournisseur)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {stagingVariantes.length > 0 ? (
            <div className="space-y-2">
              <Label>Variantes commandées (quantité par couleur/taille)</Label>
              <div className="divide-y divide-ink-900/5 rounded-xl border border-ink-900/10">
                {stagingVariantes.map((v) => {
                  const stock = v.inventory?.[0]?.quantite_disponible ?? 0;
                  const label = v.nom || [v.couleur, v.taille].filter(Boolean).join(" / ") || "Standard";
                  const quantite = stagingQuantites[v.id] ?? 0;
                  const photo = imageParVariante?.[v.id];
                  return (
                    <div key={v.id} className="flex items-center justify-between gap-3 p-3">
                      <div className="flex items-center gap-3">
                        {photo && (
                          <div className="relative h-10 w-10 shrink-0">
                            <Image src={photo} alt={label} fill sizes="40px" className="rounded-lg object-cover" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium">{label}</p>
                          <p className={`text-xs ${stock > 0 ? "text-ink-900/50" : "text-red-600"}`}>
                            {stock > 0 ? `${stock} en stock` : "Rupture de stock"}
                          </p>
                        </div>
                      </div>
                      <Input
                        type="number"
                        min={0}
                        max={stock > 0 ? stock : 0}
                        value={quantite || ""}
                        disabled={stock <= 0}
                        onChange={(e) => onQuantiteChange(v.id, Number(e.target.value))}
                        className="w-20"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <Label htmlFor="quantiteSansVariante">Quantité</Label>
              <Input
                id="quantiteSansVariante"
                type="number"
                min={0}
                value={stagingQuantites["sans_variante"] || ""}
                onChange={(e) => onQuantiteChange("sans_variante", Number(e.target.value))}
              />
            </div>
          )}

          {modeTarification === "parProduit" ? (
            <div>
              <Label htmlFor="prixVenteInput">Prix de vente pour ce produit (FCFA, sans la livraison)</Label>
              <Input
                id="prixVenteInput"
                type="number"
                min={0}
                value={stagingPrixVente || ""}
                onChange={(e) => onPrixVenteChange(Number(e.target.value))}
              />
              {stagingQuantiteTotale > 0 && stagingPrixVente > 0 && (
                <div className="mt-2 rounded-xl bg-terracotta-50 p-3">
                  <p className="text-xs text-terracotta-700">Bénéfice pour ce produit</p>
                  <p className="text-lg font-semibold text-terracotta-600">{formatFCFA(stagingBenefice)}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-ink-900/50">
              Prix géré plus bas, en une seule fois pour toute la commande — pas besoin de le saisir produit par produit.
            </p>
          )}

          {stagingProduit?.prix_min_conseille != null && stagingProduit?.prix_max_conseille != null && (
            <p className={`text-xs ${stagingHorsFourchette ? "text-amber-600" : "text-ink-900/50"}`}>
              Fourchette conseillée : {formatFCFA(stagingProduit.prix_min_conseille)} – {formatFCFA(stagingProduit.prix_max_conseille)} (par pièce)
            </p>
          )}

          <button
            type="button"
            disabled={stagingQuantiteTotale === 0 || (modeTarification === "parProduit" && stagingPrixVente <= 0)}
            onClick={onAjouter}
            className="w-full rounded-xl bg-green-600 py-3 text-center font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            + Ajouter ce produit à la commande
          </button>
        </div>
      )}

      <div className="mt-4">
        <Label htmlFor="observation">Observation (précisions supplémentaires)</Label>
        <textarea
          id="observation"
          name="observation"
          rows={2}
          value={observation}
          onChange={(e) => onObservationChange(e.target.value)}
          placeholder="Ex : préférence du client, remarque particulière..."
          className="w-full rounded-xl border border-ink-900/10 bg-surface p-3 text-sm"
        />
      </div>
    </Card>
  );
}
