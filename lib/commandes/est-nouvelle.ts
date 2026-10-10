/**
 * Une commande compte comme « nouvelle » (badge rouge, onglet Nouvelles,
 * compteur du menu) quand :
 * - elle est en `confirmation` (jamais traitée), ou
 * - elle est `à relancer` et que sa date de relance est arrivée (aujourd'hui
 *   ou déjà passée) : elle redevient une commande à traiter le jour de la
 *   relance, jusqu'à l'impression du bon qui la passe en livraison.
 *
 * Abidjan est en UTC toute l'année : la date du jour UTC est la bonne.
 */
export function dateDuJour(): string {
  return new Date().toISOString().slice(0, 10);
}

export function estNouvelle(
  o: { statut: string; date_relance?: string | null },
  aujourdhui: string = dateDuJour(),
): boolean {
  if (o.statut === "confirmation") return true;
  return o.statut === "relance" && !!o.date_relance && o.date_relance.slice(0, 10) <= aujourdhui;
}

/** Filtre Supabase équivalent (pour compter côté base sans tout charger). */
export function filtreNouvellesSupabase(aujourdhui: string = dateDuJour()): string {
  return `statut.eq.confirmation,and(statut.eq.relance,date_relance.lte.${aujourdhui})`;
}
