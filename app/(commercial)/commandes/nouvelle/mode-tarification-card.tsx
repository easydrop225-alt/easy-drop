"use client";

import { Card } from "@/components/ui/card";

/**
 * Affichage pur du choix "prix par produit" vs "un seul prix total" — la
 * bascule est désactivée dès qu'un produit est déjà dans le panier (changer
 * de mode à ce stade rendrait les prix déjà saisis incohérents).
 */
export function ModeTarificationCard({
  modeTarification,
  onChange,
  panierNonVide,
}: {
  modeTarification: "parProduit" | "total";
  onChange: (mode: "parProduit" | "total") => void;
  panierNonVide: boolean;
}) {
  return (
    <Card>
      <h2 className="mb-3 font-medium">Mode de tarification</h2>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={panierNonVide}
          onClick={() => onChange("parProduit")}
          className={`rounded-xl border p-3 text-left text-sm transition ${
            modeTarification === "parProduit" ? "border-terracotta-500 bg-terracotta-50" : "border-ink-900/10"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <p className="font-medium">Prix par produit</p>
          <p className="text-xs text-ink-900/50">Un prix différent pour chaque produit ajouté.</p>
        </button>
        <button
          type="button"
          disabled={panierNonVide}
          onClick={() => onChange("total")}
          className={`rounded-xl border p-3 text-left text-sm transition ${
            modeTarification === "total" ? "border-terracotta-500 bg-terracotta-50" : "border-ink-900/10"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <p className="font-medium">Un seul prix total</p>
          <p className="text-xs text-ink-900/50">Un seul prix pour toute la commande, réparti automatiquement.</p>
        </button>
      </div>
      {panierNonVide && (
        <p className="mt-2 text-xs text-ink-900/40">
          Vide le panier ci-dessous pour changer de mode de tarification.
        </p>
      )}
    </Card>
  );
}
