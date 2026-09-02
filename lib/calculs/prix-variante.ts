/**
 * Règle centrale : une variante peut avoir son propre prix fournisseur
 * (ex : une taille XXL plus coûteuse à produire) ; si elle n'en a pas, on
 * retombe sur le prix fournisseur du produit. Cette règle était dupliquée
 * entre le formulaire de commande (calcul en direct côté commercial) et
 * l'action serveur (enregistrement réel de la commande) — centralisée ici
 * pour qu'elle ne puisse plus se désynchroniser entre les deux.
 */
export function prixFournisseurEffectif(
  prixFournisseurVariante: number | null | undefined,
  prixFournisseurProduit: number
): number {
  return prixFournisseurVariante ?? prixFournisseurProduit;
}

export interface LigneQuantite {
  productVariantId: string | null;
  quantite: number;
}

/**
 * Coût fournisseur total pour un ensemble de lignes (variantes + quantités)
 * d'un même produit. `prixFournisseurParVarianteId` permet à chaque appelant
 * de fournir sa propre source de données (tableau en mémoire côté
 * formulaire, requête Supabase côté serveur) sans dupliquer la règle
 * elle-même.
 */
export function coutFournisseurLignes(
  lignes: LigneQuantite[],
  prixFournisseurProduit: number,
  prixFournisseurParVarianteId: (variantId: string) => number | null | undefined
): number {
  return lignes.reduce((acc, ligne) => {
    const prixVariante = ligne.productVariantId ? prixFournisseurParVarianteId(ligne.productVariantId) : undefined;
    const prix = prixFournisseurEffectif(prixVariante, prixFournisseurProduit);
    return acc + ligne.quantite * prix;
  }, 0);
}
