import { cn } from "@/lib/utils";
import type { OrderStatut } from "@/types/database";

const ETAPES: { key: OrderStatut; label: string }[] = [
  { key: "nouvelle", label: "Créée" },
  { key: "confirmee", label: "Confirmée" },
  { key: "en_preparation", label: "Préparation" },
  { key: "en_livraison", label: "En livraison" },
  { key: "livree", label: "Livrée" },
  { key: "terminee", label: "Terminée" },
];

export function OrderTimeline({ statut }: { statut: OrderStatut }) {
  const isCancelled = ["annulee", "refusee", "retour"].includes(statut);
  const currentIndex = ETAPES.findIndex((e) => e.key === statut);

  if (isCancelled) {
    return (
      <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
        Cette commande est marquée comme : {statut.replace("_", " ")}.
      </p>
    );
  }

  return (
    <ol className="flex flex-wrap gap-2">
      {ETAPES.map((etape, i) => (
        <li
          key={etape.key}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-medium",
            i <= currentIndex ? "bg-terracotta-500 text-white" : "bg-beige-100 text-ink-900/40"
          )}
        >
          {etape.label}
        </li>
      ))}
    </ol>
  );
}
