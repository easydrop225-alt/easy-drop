"use client";

import { useState, useTransition } from "react";
import { changerStatutCommande } from "@/app/admin/commandes/actions";
import type { OrderStatut } from "@/types/database";

const STATUTS: { value: OrderStatut; label: string }[] = [
  { value: "confirmation", label: "🟡 En attente de confirmation" },
  { value: "traitement", label: "🔵 En traitement" },
  { value: "livraison", label: "🟣 En cours de livraison" },
  { value: "livree", label: "🟢 Livrée" },
  { value: "annulee", label: "🔴 Annulée" },
  { value: "relance", label: "🟠 À relancer" },
];

/**
 * Changement de statut directement depuis la liste des commandes, sans
 * ouvrir le détail. Pour "À relancer", une date est requise : un petit
 * champ apparaît avant de valider. Les autres statuts se valident
 * immédiatement à la sélection.
 */
export function StatutRapideSelect({ orderId, statutActuel }: { orderId: string; statutActuel: OrderStatut }) {
  const [statutChoisi, setStatutChoisi] = useState<OrderStatut | null>(null);
  const [dateRelance, setDateRelance] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function appliquer(statut: OrderStatut, date?: string) {
    setError(null);
    startTransition(async () => {
      const res = await changerStatutCommande(orderId, statut, undefined, date);
      if (res?.error) setError(res.error);
      else setStatutChoisi(null);
    });
  }

  function handleChange(valeur: OrderStatut) {
    if (valeur === statutActuel) return;
    if (valeur === "relance") {
      setStatutChoisi("relance"); // ouvre le petit sélecteur de date avant validation
      return;
    }
    appliquer(valeur);
  }

  return (
    <div onClick={(e) => e.stopPropagation()} className="flex flex-col gap-1">
      <select
        value={statutActuel}
        onChange={(e) => handleChange(e.target.value as OrderStatut)}
        disabled={pending}
        className="h-8 rounded-lg border border-ink-900/10 bg-surface px-2 text-xs"
      >
        {STATUTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>

      {statutChoisi === "relance" && (
        <div className="flex items-center gap-1">
          <input
            type="date"
            value={dateRelance}
            onChange={(e) => setDateRelance(e.target.value)}
            className="h-8 rounded-lg border border-ink-900/10 px-2 text-xs"
          />
          <button
            type="button"
            disabled={!dateRelance || pending}
            onClick={() => appliquer("relance", dateRelance)}
            className="rounded-lg bg-terracotta-500 px-2 py-1 text-xs text-white disabled:opacity-40"
          >
            OK
          </button>
        </div>
      )}
      {error && <p className="text-[10px] text-red-600">{error}</p>}
    </div>
  );
}
