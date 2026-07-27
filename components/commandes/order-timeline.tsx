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
  if (statut === "confirmation") {
    return (
      <p className="rounded-xl bg-yellow-50 p-3 text-sm text-yellow-800">
        🟡 En attente de confirmation.
      </p>
    );
  }

  if (statut === "traitement") {
    return (
      <p className="rounded-xl bg-blue-50 p-3 text-sm text-blue-700">
        🔵 Commande en traitement.
      </p>
    );
  }

  if (statut === "livraison") {
    return (
      <p className="rounded-xl bg-purple-50 p-3 text-sm text-purple-700">
        🟣 Commande en cours de livraison.
      </p>
    );
  }

  if (statut === "livree") {
    return (
      <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
        🟢 Commande livrée avec succès ✓
      </p>
    );
  }

  if (statut === "annulee") {
    return (
      <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
        <p>🔴 Commande annulée.</p>
        {motif && <p className="mt-1 text-xs">Motif : {motif}</p>}
      </div>
    );
  }

  // relance
  return (
    <div className="rounded-xl bg-orange-50 p-3 text-sm text-orange-700">
      <p>🟠 À relancer.</p>
      {dateRelance && <p className="mt-1 text-xs">Nouvelle date : {formatDate(dateRelance)}</p>}
    </div>
  );
}
