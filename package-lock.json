import type { ZoneLivraison } from "@/types/database";

/**
 * Détermine la date de livraison prévue selon la règle :
 * "Commande enregistrée entre 10h et 24h → livraison programmée le lendemain,
 *  y compris les commandes du lendemain enregistrées avant 10h."
 *
 * Exemple : une commande créée lundi entre 10h et 23h59, ou mardi avant 10h,
 * est programmée pour mardi.
 *
 * (voir 01_CAHIER_DES_CHARGES.md §8 et 06_DECISIONS_TECHNIQUES.md)
 */
export function calculDateLivraisonPrevue(now: Date = new Date()): {
  dateLivraison: Date;
  eligibleLendemain: boolean;
} {
  const heure = now.getHours();
  const eligibleLendemain = heure >= 10; // entre 10h et 24h

  const dateLivraison = new Date(now);
  // >= 10h : livraison le lendemain (+1 jour).
  // < 10h : livraison le jour même (le "lendemain" de la commande de la veille).
  dateLivraison.setDate(dateLivraison.getDate() + (eligibleLendemain ? 1 : 0));

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
