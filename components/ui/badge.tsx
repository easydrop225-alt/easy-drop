import { cn } from "@/lib/utils";
import type { OrderStatut } from "@/types/database";

const STATUT_STYLES: Record<OrderStatut, string> = {
  nouvelle: "bg-blue-100 text-blue-700",
  en_attente: "bg-amber-100 text-amber-700",
  confirmee: "bg-emerald-100 text-emerald-700",
  en_preparation: "bg-amber-100 text-amber-700",
  en_livraison: "bg-blue-100 text-blue-700",
  livree: "bg-emerald-100 text-emerald-700",
  terminee: "bg-emerald-200 text-emerald-800",
  annulee: "bg-red-100 text-red-700",
  refusee: "bg-red-100 text-red-700",
  client_injoignable: "bg-orange-100 text-orange-700",
  relance: "bg-orange-100 text-orange-700",
  retour: "bg-red-100 text-red-700",
};

const STATUT_LABELS: Record<OrderStatut, string> = {
  nouvelle: "Nouvelle commande",
  en_attente: "En attente",
  confirmee: "Confirmée",
  en_preparation: "En préparation",
  en_livraison: "En livraison",
  livree: "Livrée",
  terminee: "Terminée",
  annulee: "Annulée",
  refusee: "Refusée",
  client_injoignable: "Client injoignable",
  relance: "Relance",
  retour: "Retour",
};

export function StatutBadge({ statut }: { statut: OrderStatut }) {
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", STATUT_STYLES[statut])}>
      {STATUT_LABELS[statut]}
    </span>
  );
}
