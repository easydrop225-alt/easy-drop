"use client";

import { useState, useTransition } from "react";
import { changerStatutPlusieursCommandes } from "@/app/admin/commandes/actions";
import { Button } from "@/components/ui/button";
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
 * Barre d'action groupée : change le statut de toutes les commandes
 * sélectionnées en une seule fois, plutôt qu'une par une. N'apparaît que
 * lorsqu'au moins une commande est cochée.
 */
export function BarreActionGroupee({ orderIds, onTermine }: { orderIds: string[]; onTermine: () => void }) {
  const [statut, setStatut] = useState<OrderStatut>("traitement");
  const [dateRelance, setDateRelance] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function appliquer() {
    if (statut === "relance" && !dateRelance) {
      setError("Choisis une date de relance.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await changerStatutPlusieursCommandes(orderIds, statut, dateRelance || undefined);
      if (res?.error) setError(res.error);
      else onTermine();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-terracotta-200 bg-terracotta-50 p-3">
      <span className="text-sm font-medium text-terracotta-700">
        {orderIds.length} commande{orderIds.length > 1 ? "s" : ""} sélectionnée{orderIds.length > 1 ? "s" : ""}
      </span>
      <select
        value={statut}
        onChange={(e) => setStatut(e.target.value as OrderStatut)}
        className="h-9 rounded-lg border border-ink-900/10 bg-surface px-2 text-sm"
      >
        {STATUTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
      {statut === "relance" && (
        <input
          type="date"
          value={dateRelance}
          onChange={(e) => setDateRelance(e.target.value)}
          className="h-9 rounded-lg border border-ink-900/10 px-2 text-sm"
        />
      )}
      <Button size="sm" disabled={pending} onClick={appliquer}>
        {pending ? "Application..." : "Appliquer à la sélection"}
      </Button>
      <button type="button" onClick={onTermine} className="text-sm text-ink-900/50 underline">
        Annuler
      </button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </div>
  );
}
