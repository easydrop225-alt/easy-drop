"use client";

import Image from "next/image";

export interface LignePanierAffichage {
  cle: string;
  nomProduit: string;
  quantite: number;
  photo?: string;
  detail: string;
}

/**
 * Affichage pur du panier ("Produits de cette commande") — tout le calcul
 * (bénéfice, répartition du prix, choix de la photo) reste dans le
 * formulaire parent ; ce composant ne fait que rendre des lignes déjà
 * prêtes, pour rester simple à relire et sans dupliquer la logique métier.
 */
export function PanierCommande({
  lignes,
  onRetirer,
}: {
  lignes: LignePanierAffichage[];
  onRetirer: (index: number) => void;
}) {
  if (lignes.length === 0) return null;

  return (
    <div>
      <h2 className="mb-3 font-medium">Produits de cette commande ({lignes.length})</h2>
      <div className="divide-y divide-ink-900/5">
        {lignes.map((ligne, index) => (
          <div key={ligne.cle} className="flex items-center justify-between gap-3 py-2.5">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 shrink-0">
                {ligne.photo ? (
                  <Image src={ligne.photo} alt="" fill sizes="48px" className="rounded-lg object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-beige-100 text-ink-900/30">
                    <span className="text-lg">📦</span>
                  </div>
                )}
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-terracotta-500 px-1 text-[11px] font-semibold text-white">
                  {ligne.quantite}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium">{ligne.nomProduit}</p>
                <p className="text-xs text-ink-900/50">{ligne.detail}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onRetirer(index)}
              className="shrink-0 text-xs text-red-600 underline"
            >
              Retirer
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
