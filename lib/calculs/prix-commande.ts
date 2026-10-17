import { repartirProportionnellement } from "./repartition-proportionnelle";

/** Une ligne de commande vue sous l'angle du prix : quantité + prix de vente total de la ligne. */
export interface LignePrix {
  id: string;
  quantite: number;
  totalLigne: number;
}

/**
 * Répartit la part « produits » d'une commande (prix total − livraison)
 * entre ses lignes, au prorata des poids donnés (les prix de ligne tels
 * qu'ils étaient avant la modification). Sans poids exploitable (tout à 0),
 * on répartit au prorata des quantités. Arrondi au franc, la dernière ligne
 * absorbe le reliquat : la somme retombe toujours exactement sur partProduits.
 */
export function repartirPartProduits(poids: LignePrix[], partProduits: number): LignePrix[] {
  if (poids.length === 0) return [];
  const somme = poids.reduce((a, l) => a + l.totalLigne, 0);
  const base = somme > 0 ? poids.map((l) => ({ id: l.id, montant: l.totalLigne })) : poids.map((l) => ({ id: l.id, montant: l.quantite }));
  const sommeBase = base.reduce((a, b) => a + b.montant, 0);
  const ajustes = repartirProportionnellement(base, partProduits - sommeBase);
  return poids.map((l, i) => ({ ...l, totalLigne: Math.max(0, ajustes[i]?.nouveauMontant ?? 0) }));
}

/** Prix de vente unitaire stocké en base (colonne numeric) à partir du total de la ligne. */
export function prixUnitaireDepuisTotal(totalLigne: number, quantite: number): number {
  if (quantite <= 0) return 0;
  return Math.round((totalLigne / quantite) * 100) / 100;
}
