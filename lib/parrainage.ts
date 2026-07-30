/**
 * Grille des niveaux de parrainage Easy Drop. La valeur du point dépend des
 * ventes personnelles du parrain sur le mois en cours — ça l'incite à rester
 * actif plutôt que de vivre uniquement des ventes de son réseau.
 */
export interface NiveauParrainage {
  niveau: string;
  min: number;
  max: number | null;
  valeurPoint: number;
}

export const GRILLE_PARRAINAGE: NiveauParrainage[] = [
  { niveau: "Débutant", min: 0, max: 5, valeurPoint: 0 },
  { niveau: "Bronze", min: 6, max: 8, valeurPoint: 40 },
  { niveau: "Argent", min: 9, max: 12, valeurPoint: 80 },
  { niveau: "Or", min: 13, max: 16, valeurPoint: 100 },
  { niveau: "Platine", min: 17, max: 25, valeurPoint: 120 },
  { niveau: "Diamant", min: 26, max: null, valeurPoint: 150 },
];

export function niveauPourVentes(ventesPersonnelles: number): NiveauParrainage {
  for (let i = GRILLE_PARRAINAGE.length - 1; i >= 0; i--) {
    const palier = GRILLE_PARRAINAGE[i];
    if (palier && ventesPersonnelles >= palier.min) return palier;
  }
  return GRILLE_PARRAINAGE[0]!;
}

/** Prochain palier à atteindre (null si déjà au maximum). */
export function prochainNiveau(ventesPersonnelles: number): NiveauParrainage | null {
  return GRILLE_PARRAINAGE.find((p) => ventesPersonnelles < p.min) ?? null;
}

export function calculerBonusParrainage(nombrePoints: number, ventesPersonnelles: number) {
  const { niveau, valeurPoint } = niveauPourVentes(ventesPersonnelles);
  return { niveau, valeurPoint, montant: nombrePoints * valeurPoint };
}

/** Premier jour du mois (YYYY-MM-01) pour une date donnée — sert de clé "mois". */
export function premierJourDuMois(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().slice(0, 10);
}
