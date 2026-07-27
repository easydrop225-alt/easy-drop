"use client";

import { useState, useTransition } from "react";
import { changerStatutCommande } from "../actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { OrderStatut } from "@/types/database";

const STATUTS: { value: OrderStatut; label: string }[] = [
  { value: "nouvelle", label: "En cours (pas encore résolue)" },
  { value: "livree", label: "Livrée" },
  { value: "non_livree", label: "Non livrée" },
  { value: "relance", label: "Relance" },
];

const MOTIFS = ["Client absent", "Adresse incorrecte", "Téléphone injoignable", "Refus colis", "Erreur commande", "Autre"];

export function StatutForm({
  orderId,
  statutActuel,
  dateRelanceActuelle,
}: {
  orderId: string;
  statutActuel: OrderStatut;
  dateRelanceActuelle?: string | null;
}) {
  const [statut, setStatut] = useState<OrderStatut>(statutActuel);
  const [motif, setMotif] = useState("");
  const [dateRelance, setDateRelance] = useState(dateRelanceActuelle ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleValider() {
    setError(null);
    if (statut === "relance" && !dateRelance) {
      setError("Merci de préciser une date de relance.");
      return;
    }
    startTransition(async () => {
      const res = await changerStatutCommande(
        orderId,
        statut,
        statut === "non_livree" ? motif : undefined,
        statut === "relance" ? dateRelance : undefined
      );
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

      {statut === "non_livree" && (
        <select
          value={motif}
          onChange={(e) => setMotif(e.target.value)}
          className="h-10 w-full rounded-xl border border-ink-900/10 bg-white px-3 text-sm"
        >
          <option value="">Choisir un motif</option>
          {MOTIFS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      )}

      {statut === "relance" && (
        <div>
          <Label htmlFor="dateRelance">Nouvelle date de relance</Label>
          <Input
            id="dateRelance"
            type="date"
            value={dateRelance}
            onChange={(e) => setDateRelance(e.target.value)}
          />
          <p className="mt-1 text-xs text-ink-900/50">
            Cette date remplace la date de livraison prévue : la commande réapparaîtra
            automatiquement dans le résumé du jour du commercial à cette date-là.
          </p>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button size="sm" disabled={pending} onClick={handleValider}>
        {pending ? "Mise à jour..." : "Mettre à jour le statut"}
      </Button>
    </div>
  );
}
