import { cn } from "@/lib/utils";
import type { OrderStatut } from "@/types/database";

const STATUT_STYLES: Record<OrderStatut, string> = {
  nouvelle: "bg-blue-100 text-blue-700",
  livree: "bg-emerald-100 text-emerald-700",
  non_livree: "bg-red-100 text-red-700",
  relance: "bg-orange-100 text-orange-700",
};

const STATUT_LABELS: Record<OrderStatut, string> = {
  nouvelle: "En cours",
  livree: "Livrée",
  non_livree: "Non livrée",
  relance: "Relance",
};

export function StatutBadge({ statut }: { statut: OrderStatut }) {
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", STATUT_STYLES[statut])}>
      {STATUT_LABELS[statut]}
    </span>
  );
}
