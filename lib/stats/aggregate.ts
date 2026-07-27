/**
 * Agrégation de séries temporelles journalières en jour / semaine / mois / année.
 * Utilisé par les graphiques de performance (dashboard commercial + rapports admin).
 */

export type Granularite = "jour" | "semaine" | "mois" | "annee";

export interface PointJournalier {
  date: string; // format YYYY-MM-DD
  valeur: number;
}

export interface PointAgrege {
  label: string;
  valeur: number;
}

function numeroSemaine(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const jourSemaine = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - jourSemaine);
  const debutAnnee = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const semaine = Math.ceil(((date.getTime() - debutAnnee.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-S${String(semaine).padStart(2, "0")}`;
}

const MOIS_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

export function agregerParPeriode(points: PointJournalier[], granularite: Granularite): PointAgrege[] {
  const buckets = new Map<string, number>();

  for (const p of points) {
    const d = new Date(p.date + "T00:00:00");
    let cle: string;
    switch (granularite) {
      case "jour":
        cle = p.date.slice(5); // MM-DD
        break;
      case "semaine":
        cle = numeroSemaine(d);
        break;
      case "mois":
        cle = `${MOIS_LABELS[d.getMonth()]} ${d.getFullYear()}`;
        break;
      case "annee":
        cle = String(d.getFullYear());
        break;
    }
    buckets.set(cle, (buckets.get(cle) ?? 0) + p.valeur);
  }

  return Array.from(buckets.entries()).map(([label, valeur]) => ({ label, valeur }));
}

/** Génère la liste des dates (YYYY-MM-DD) entre deux bornes incluses. */
export function plagesDates(debut: Date, fin: Date): string[] {
  const dates: string[] = [];
  const cursor = new Date(debut);
  while (cursor <= fin) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}
