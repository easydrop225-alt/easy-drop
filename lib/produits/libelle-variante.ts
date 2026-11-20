/**
 * Libellés d'articles de commande — utilisables aussi bien côté serveur
 * (pages, bon imprimable) que côté client (formulaires), d'où l'absence de
 * "use client" ici.
 */

interface VarianteLibelle {
  nom?: string | null;
  couleur?: string | null;
  taille?: string | null;
}

/**
 * Variante « Standard » : créée automatiquement pour suivre le stock d'un
 * produit qui n'a pas de variantes (ni nom, ni couleur, ni taille). Elle est
 * invisible pour l'utilisateur : on affiche juste le nom du produit.
 */
export function estVarianteStandard(v: VarianteLibelle | null | undefined): boolean {
  return !!v && !v.nom && !v.couleur && !v.taille;
}

/** Nom d'une variante : son nom personnalisé, sinon "couleur / taille". */
export function libelleVariante(v: VarianteLibelle): string {
  return v.nom || [v.couleur, v.taille].filter(Boolean).join(" / ") || "Standard";
}

/**
 * Libellé complet d'un article : "Produit — Variante" quand une variante a
 * été choisie, sinon juste le nom du produit. Permet de savoir d'un coup
 * d'œil, y compris sur le bon imprimé, quel produit précis et quelle
 * variante précise ont été commandés.
 */
export function libelleArticle(nomProduit: string | null | undefined, variante?: VarianteLibelle | null): string {
  const nom = nomProduit ?? "Produit";
  return variante && !estVarianteStandard(variante) ? `${nom} — ${libelleVariante(variante)}` : nom;
}
