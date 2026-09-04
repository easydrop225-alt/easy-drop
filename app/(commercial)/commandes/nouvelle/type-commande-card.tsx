"use client";

import { Card } from "@/components/ui/card";

export type TypeCommande = "unique" | "multiple";

/**
 * Première question posée avant de commencer à remplir la commande — elle
 * simplifie la suite du formulaire : pour un produit unique, pas besoin de
 * choisir un mode de tarification ni de gérer un panier, juste un prix de
 * vente et un prix de livraison, chacun de leur côté.
 */
export function TypeCommandeCard({
  valeur,
  onChange,
  verrouille,
}: {
  valeur: TypeCommande | null;
  onChange: (v: TypeCommande) => void;
  verrouille: boolean;
}) {
  return (
    <Card>
      <h2 className="mb-3 font-medium">Cette commande contient...</h2>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          disabled={verrouille}
          onClick={() => onChange("unique")}
          className={`rounded-xl border p-3 text-left text-sm transition ${
            valeur === "unique" ? "border-terracotta-500 bg-terracotta-50" : "border-ink-900/10"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <p className="font-medium">Un seul produit</p>
          <p className="text-xs text-ink-900/50">Une seule référence, avec sa propre quantité/variante.</p>
        </button>
        <button
          type="button"
          disabled={verrouille}
          onClick={() => onChange("multiple")}
          className={`rounded-xl border p-3 text-left text-sm transition ${
            valeur === "multiple" ? "border-terracotta-500 bg-terracotta-50" : "border-ink-900/10"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <p className="font-medium">Plusieurs produits ou variantes</p>
          <p className="text-xs text-ink-900/50">Plusieurs produits différents, ou le même produit en plusieurs couleurs/tailles.</p>
        </button>
      </div>
      {verrouille && (
        <p className="mt-2 text-xs text-ink-900/40">
          Vide le panier ci-dessous pour changer ce choix.
        </p>
      )}
    </Card>
  );
}
