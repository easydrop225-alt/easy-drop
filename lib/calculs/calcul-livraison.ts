import type { ZoneLivraison } from "@/types/database";

/**
 * Détermine si une commande créée à l'instant `now` peut bénéficier
 * de la livraison automatique le lendemain, selon la règle :
 * "Commande enregistrée entre 10h et 24h → livraison automatique lendemain."
 * (voir 01_CAHIER_DES_CHARGES.md §8)
 */
export function calculDateLivraisonPrevue(now: Date = new Date()): {
  dateLivraison: Date;
  eligibleLendemain: boolean;
} {
  const heure = now.getHours();
  const eligibleLendemain = heure >= 10; // entre 10h et 24h (exclusif minuit-10h)

  const dateLivraison = new Date(now);
  dateLivraison.setDate(dateLivraison.getDate() + (eligibleLendemain ? 1 : 2));

  return { dateLivraison, eligibleLendemain };
}

/**
 * Retourne la fourchette de frais de livraison par défaut selon la zone.
 * Les valeurs réelles doivent être lues depuis la table `settings` ;
 * ces constantes ne servent que de repli si les paramètres ne sont pas chargés.
 */
export function fourchetteFraisParDefaut(zone: ZoneLivraison): { min: number; max: number } {
  return zone === "abidjan" ? { min: 1500, max: 2000 } : { min: 2500, max: 4000 };
}
