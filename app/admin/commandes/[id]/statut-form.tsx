"use client";

import { useState, useTransition } from "react";
import { changerStatutCommande } from "../actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { OrderStatut } from "@/types/database";

const STATUTS: { value: OrderStatut; label: string }[] = [
  { value: "confirmation", label: "🟡 En attente de confirmation" },
  { value: "traitement", label: "🔵 En traitement" },
  { value: "livraison", label: "🟣 En cours de livraison" },
  { value: "livree", label: "🟢 Livrée" },
  { value: "annulee", label: "🔴 Annulée" },
  { value: "relance", label: "🟠 À relancer" },
];

// Le motif/note est disponible pour les 3 statuts "de résolution" :
// livrée avec succès, annulée, et à relancer.
const STATUTS_AVEC_MOTIF: OrderStatut[] = ["livree", "annulee", "relance"];

const MOTIFS = ["Client absent", "Adresse incorrecte", "Téléphone injoignable", "Refus colis", "Erreur commande", "Livraison confirmée par le client", "Autre"];

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
  const [motifAutre, setMotifAutre] = useState("");
  const [dateRelance, setDateRelance] = useState(dateRelanceActuelle ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleValider() {
    setError(null);
    if (statut === "relance" && !dateRelance) {
      setError("Merci de préciser une date de relance.");
      return;
    }
    const motifFinal = motif === "Autre" ? motifAutre : motif;
    startTransition(async () => {
      const res = await changerStatutCommande(
        orderId,
        statut,
        STATUTS_AVEC_MOTIF.includes(statut) ? (motifFinal || undefined) : undefined,
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
        className="h-10 w-full rounded-xl border border-ink-900/10 bg-surface px-3 text-sm"
      >
        {STATUTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>

      {STATUTS_AVEC_MOTIF.includes(statut) && (
        <div className="space-y-2">
          <select
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            className="h-10 w-full rounded-xl border border-ink-900/10 bg-surface px-3 text-sm"
          >
            <option value="">Choisir un motif / une note (facultatif)</option>
            {MOTIFS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          {motif === "Autre" && (
            <textarea
              value={motifAutre}
              onChange={(e) => setMotifAutre(e.target.value)}
              rows={2}
              placeholder="Précise ici..."
              className="w-full rounded-xl border border-ink-900/10 p-3 text-sm"
            />
          )}
        </div>
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
