"use client";

import { useState, useTransition } from "react";
import { demanderSuppressionCommande, annulerDemandeSuppression } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DemandeSuppressionForm({
  orderId,
  demandeEnCours,
}: {
  orderId: string;
  demandeEnCours: boolean;
}) {
  const [motif, setMotif] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(demandeEnCours);

  if (enCours) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-amber-700">
          En attente de validation par le commercial pour supprimer cette commande.
        </p>
        <Button
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await annulerDemandeSuppression(orderId);
              if (res?.error) setError(res.error);
              else setEnCours(false);
            })
          }
        >
          Annuler la demande
        </Button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Input
        placeholder="Motif de la suppression (optionnel)"
        value={motif}
        onChange={(e) => setMotif(e.target.value)}
      />
      <Button
        size="sm"
        variant="danger"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await demanderSuppressionCommande(orderId, motif);
            if (res?.error) setError(res.error);
            else setEnCours(true);
          })
        }
      >
        {pending ? "Envoi..." : "Demander la suppression au commercial"}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
