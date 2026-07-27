import { cn } from "@/lib/utils";
import type { OrderStatut } from "@/types/database";

const STATUT_STYLES: Record<OrderStatut, string> = {
  confirmation: "bg-yellow-100 text-yellow-800",
  traitement: "bg-blue-100 text-blue-700",
  livraison: "bg-purple-100 text-purple-700",
  livree: "bg-emerald-100 text-emerald-700",
  annulee: "bg-red-100 text-red-700",
  relance: "bg-orange-100 text-orange-700",
};

const STATUT_LABELS: Record<OrderStatut, string> = {
  confirmation: "🟡 En attente de confirmation",
  traitement: "🔵 En traitement",
  livraison: "🟣 En cours de livraison",
  livree: "🟢 Livrée",
  annulee: "🔴 Annulée",
  relance: "🟠 À relancer",
};

export function StatutBadge({ statut }: { statut: OrderStatut }) {
  return (
    <span className={cn("whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium", STATUT_STYLES[statut])}>
      {STATUT_LABELS[statut]}
    </span>
  );
}
