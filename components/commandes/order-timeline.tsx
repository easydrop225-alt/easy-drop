import { formatDate } from "@/lib/utils";
import type { OrderStatut } from "@/types/database";

export function OrderTimeline({
  statut,
  motif,
  dateRelance,
}: {
  statut: OrderStatut;
  motif?: string | null;
  dateRelance?: string | null;
}) {
  if (statut === "nouvelle") {
    return (
      <p className="rounded-xl bg-blue-50 p-3 text-sm text-blue-700">
        Commande en cours de traitement.
      </p>
    );
  }

  if (statut === "livree") {
    return (
      <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
        Commande livrée avec succès ✓
      </p>
    );
  }

  if (statut === "non_livree") {
    return (
      <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
        <p>Commande non livrée.</p>
        {motif && <p className="mt-1 text-xs">Motif : {motif}</p>}
      </div>
    );
  }

  // relance
  return (
    <div className="rounded-xl bg-orange-50 p-3 text-sm text-orange-700">
      <p>Relance programmée.</p>
      {dateRelance && <p className="mt-1 text-xs">Nouvelle date : {formatDate(dateRelance)}</p>}
    </div>
  );
}
