export interface MontantIdentifie {
  id: string;
  montant: number;
}

export interface MontantAjuste {
  id: string;
  nouveauMontant: number;
}

/**
 * Répartit un delta (positif ou négatif) sur une liste de montants au
 * prorata de leur poids actuel, en arrondissant au franc — la dernière
 * entrée absorbe le reliquat d'arrondi pour que la somme finale retombe
 * exactement sur (somme actuelle + delta), jamais approximative.
 *
 * Sert à la fois à répartir une correction de frais de livraison sur les
 * lignes de vente d'une commande, et à répercuter la même correction sur
 * les lignes de bénéfice en attente correspondantes (voir modifierFraisLivraison).
 */
export function repartirProportionnellement(montants: MontantIdentifie[], delta: number): MontantAjuste[] {
  if (montants.length === 0) return [];
  if (delta === 0) return montants.map((m) => ({ id: m.id, nouveauMontant: m.montant }));

  const total = montants.reduce((a, m) => a + m.montant, 0);
  let reparti = 0;

  return montants.map((m, index) => {
    let part: number;
    if (index === montants.length - 1) {
      part = delta - reparti;
    } else {
      part = total !== 0 ? Math.round((delta * m.montant) / total) : Math.round(delta / montants.length);
      reparti += part;
    }
    return { id: m.id, nouveauMontant: m.montant + part };
  });
}
