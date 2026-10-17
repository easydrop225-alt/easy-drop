"use client";

import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { formatFCFA } from "@/lib/utils";
import type { ZoneLivraison } from "@/types/database";

/** Tarifs de livraison proposés au commercial (décision de Yann, 17/10/2026). */
export const TARIFS_LIVRAISON = [0, 1500, 2000, 2500, 3000, 3500, 4000];

/**
 * Affichage + saisie du récapitulatif final — reçoit uniquement des valeurs
 * déjà calculées par le formulaire parent (aucune logique de répartition
 * ici), à l'exception du champ de saisie du prix total en mode "un seul
 * prix", qui reste simple (juste un setState transmis par le parent).
 */
export function RecapitulatifCommande({
  nombreProduits,
  quantiteTotale,
  modeTarification,
  zone,
  prixLivraison,
  onChangePrixLivraison,
  prixTotalCommande,
  onChangePrixTotalCommande,
  prixVenteTotalPanier,
  prixTotalAvecLivraison,
  beneficeTotalPanier,
}: {
  nombreProduits: number;
  quantiteTotale: number;
  modeTarification: "parProduit" | "total";
  zone: ZoneLivraison;
  prixLivraison: number;
  onChangePrixLivraison: (valeur: number) => void;
  prixTotalCommande: number;
  onChangePrixTotalCommande: (valeur: number) => void;
  prixVenteTotalPanier: number;
  prixTotalAvecLivraison: number;
  beneficeTotalPanier: number;
}) {
  return (
    <Card className="space-y-2 bg-beige-100">
      <div className="flex justify-between text-sm">
        <span className="text-ink-900/60">Produits différents</span>
        <span>{nombreProduits}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-ink-900/60">Nombre total de pièces</span>
        <span>{quantiteTotale}</span>
      </div>

      {modeTarification === "total" ? (
        <>
          <div className="py-1">
            <p className="mb-2 text-sm font-medium">Livraison</p>
            <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Prix de la livraison">
              {TARIFS_LIVRAISON.map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={prixLivraison === t}
                  onClick={() => onChangePrixLivraison(t)}
                  className={`rounded-xl border px-2 py-2 text-sm font-medium transition ${
                    prixLivraison === t
                      ? "border-terracotta-500 bg-terracotta-500 text-white"
                      : "border-ink-900/15 bg-surface text-ink-900/80"
                  }`}
                >
                  {t === 0 ? "0 F" : `${t.toLocaleString("fr-FR")} F`}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-ink-900/50">
              {zone === "abidjan" ? "Présélectionné selon la commune choisie. Coche un autre tarif si besoin." : "Coche le tarif de livraison hors Abidjan."}
            </p>
          </div>
          <div className="py-1">
            <Label htmlFor="prixTotalCommandeInput">Prix total de la commande (prix du produit + prix de la livraison)</Label>
            <Input
              id="prixTotalCommandeInput"
              type="number"
              min={0}
              value={prixTotalCommande || ""}
              onChange={(e) => onChangePrixTotalCommande(Number(e.target.value))}
            />
            <p className="mt-1 text-xs text-ink-900/50">
              C&apos;est le montant total que le client paie, livraison comprise. La part &quot;produits&quot; est calculée automatiquement en retirant la livraison cochée juste au-dessus, puis répartie entre les {nombreProduits || "..."} produit(s) au prorata des quantités.
            </p>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ink-900/60">→ Part produits (calculée)</span>
            <span>{formatFCFA(prixVenteTotalPanier)}</span>
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-between text-sm">
            <span className="text-ink-900/60">Prix de vente (tous produits)</span>
            <span>{formatFCFA(prixVenteTotalPanier)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ink-900/60">Prix de la livraison</span>
            <span>{formatFCFA(prixLivraison)}</span>
          </div>
        </>
      )}

      <div className="flex justify-between border-t border-ink-900/10 pt-2 font-medium">
        <span>Prix total (payé par le client)</span>
        <span>{formatFCFA(prixTotalAvecLivraison)}</span>
      </div>
      <div className="mt-3 border-t border-ink-900/10 pt-3">
        <p className="text-sm text-ink-900/60">Bénéfice estimé pour cette commande</p>
        <p className="text-2xl font-semibold text-terracotta-600">{formatFCFA(beneficeTotalPanier)}</p>
      </div>
    </Card>
  );
}
