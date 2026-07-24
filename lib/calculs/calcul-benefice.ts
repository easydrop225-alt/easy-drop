/**
 * Calcul du bénéfice commercial — voir 01_CAHIER_DES_CHARGES.md §9.
 * Bénéfice = Prix vendu - Prix fournisseur - Frais de livraison
 *
 * Note : les frais de livraison sont déjà affectés au niveau de la commande
 * (une seule fois), tandis que le prix vendu/fournisseur est par ligne.
 * Cette fonction calcule le bénéfice d'une ligne de commande (hors livraison),
 * qui correspond à la colonne générée `benefice_ligne` en base de données.
 */
export function calculBeneficeLigne(
  prixVenteUnitaire: number,
  prixFournisseurUnitaire: number,
  quantite: number
): number {
  return (prixVenteUnitaire - prixFournisseurUnitaire) * quantite;
}

/**
 * Bénéfice total d'une commande = somme des bénéfices de ligne moins les
 * frais de livraison (les frais de livraison réduisent le bénéfice net
 * du commercial s'ils sont à sa charge — à ajuster selon la politique
 * commerciale finale définie dans les paramètres).
 */
export function calculBeneficeCommande(
  beneficesLigne: number[],
  fraisLivraison: number
): number {
  const totalLignes = beneficesLigne.reduce((acc, b) => acc + b, 0);
  return totalLignes - fraisLivraison;
}

export function estDansFourchette(
  prixVente: number,
  prixMin: number | null,
  prixMax: number | null
): boolean {
  if (prixMin == null || prixMax == null) return true;
  return prixVente >= prixMin && prixVente <= prixMax;
}
