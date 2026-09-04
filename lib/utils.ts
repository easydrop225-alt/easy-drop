import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFCFA(montant: number): string {
  return new Intl.NumberFormat("fr-FR").format(Math.round(montant)) + " FCFA";
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

/**
 * Date ISO d'il y a 3 mois — utilisée pour limiter les historiques affichés
 * (commandes, gains, versements) à une fenêtre récente, pour des raisons de
 * performance à mesure que le volume de données grandit. Les rapports
 * annuels (page Rapports) ne sont volontairement PAS concernés par cette
 * limite : ils continuent d'utiliser l'historique complet.
 */
export function dateIlYA3Mois(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  return d.toISOString();
}

export function dateIlYA1Mois(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString();
}
