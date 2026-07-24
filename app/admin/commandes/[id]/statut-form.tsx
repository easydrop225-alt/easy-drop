"use client";

import { useState, useTransition } from "react";
import { changerStatutCommande } from "../actions";
import { Button } from "@/components/ui/button";
import type { OrderStatut } from "@/types/database";

const STATUTS: { value: OrderStatut; label: string }[] = [
  { value: "nouvelle", label: "Nouvelle commande" },
  { value: "en_attente", label: "En attente" },
  { value: "confirmee", label: "Confirmée" },
  { value: "en_preparation", label: "En préparation" },
  { value: "en_livraison", label: "En livraison" },
  { value: "livree", label: "Livrée" },
  { value: "terminee", label: "Terminée" },
  { value: "annulee", label: "Annulée" },
  { value: "refusee", label: "Refusée" },
  { value: "client_injoignable", label: "Client injoignable" },
  { value: "relance", label: "Relance" },
  { value: "retour", label: "Retour" },
];

const MOTIFS = ["Client absent", "Adresse incorrecte", "Téléphone injoignable", "Refus colis", "Erreur commande", "Autre"];

export function StatutForm({ orderId, statutActuel }: { orderId: string; statutActuel: OrderStatut }) {
  const [statut, setStatut] = useState<OrderStatut>(statutActuel);
  const [motif, setMotif] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const necessiteMotif = ["annulee", "refusee", "retour"].includes(statut);

  function handleValider() {
    setError(null);
    startTransition(async () => {
      const res = await changerStatutCommande(orderId, statut, necessiteMotif ? motif : undefined);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="space-y-3">
      <select
        value={statut}
        onChange={(e) => setStatut(e.target.value as OrderStatut)}
        className="h-10 w-full rounded-xl border border-ink-900/10 bg-white px-3 text-sm"
      >
        {STATUTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>

      {necessiteMotif && (
        <select
          value={motif}
          onChange={(e) => setMotif(e.target.value)}
          className="h-10 w-full rounded-xl border border-ink-900/10 bg-white px-3 text-sm"
        >
          <option value="">Choisir un motif</option>
          {MOTIFS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button size="sm" disabled={pending} onClick={handleValider}>
        {pending ? "Mise à jour..." : "Mettre à jour le statut"}
      </Button>
    </div>
  );
}
