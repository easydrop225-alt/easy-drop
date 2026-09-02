export type ChampPrix = "prix_fournisseur" | "prix_min_conseille" | "prix_max_conseille";

export interface ValeursPrix {
  prix_fournisseur: number | null;
  prix_min_conseille: number | null;
  prix_max_conseille: number | null;
}

export interface ChangementPrix {
  champ: ChampPrix;
  ancienne_valeur: number | null;
  nouvelle_valeur: number | null;
}

const CHAMPS_PRIX: ChampPrix[] = ["prix_fournisseur", "prix_min_conseille", "prix_max_conseille"];

function valeursDifferentes(a: number | null, b: number | null): boolean {
  if (a === null || b === null) return a !== b;
  return Number(a) !== Number(b);
}

/**
 * Compare l'ancien et le nouveau jeu de prix d'un produit (ou d'une variante)
 * et retourne uniquement les champs qui ont réellement changé — sert à
 * n'écrire dans l'historique que ce qui a bougé, pas les trois champs à chaque fois.
 */
export function champsPrixModifies(ancien: ValeursPrix, nouveau: ValeursPrix): ChangementPrix[] {
  return CHAMPS_PRIX.filter((champ) => valeursDifferentes(ancien[champ], nouveau[champ])).map((champ) => ({
    champ,
    ancienne_valeur: ancien[champ],
    nouvelle_valeur: nouveau[champ],
  }));
}
