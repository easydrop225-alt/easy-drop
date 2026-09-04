"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { annulerCommandeParCommercial } from "../actions";
import { Button } from "@/components/ui/button";

export function AnnulerCommandeBouton({ orderId }: { orderId: string }) {
  const [ouvert, setOuvert] = useState(false);
  const [motif, setMotif] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function confirmer() {
    setError(null);
    startTransition(async () => {
      const res = await annulerCommandeParCommercial(orderId, motif);
      if (res?.error) setError(res.error);
      else {
        setOuvert(false);
        router.refresh();
      }
    });
  }

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="text-sm font-medium text-red-600 underline"
      >
        Annuler cette commande
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-3">
      <p className="text-sm text-red-700">
        Cette action est définitive. Le stock sera automatiquement remis à disposition.
      </p>
      <textarea
        value={motif}
        onChange={(e) => setMotif(e.target.value)}
        placeholder="Raison de l'annulation (optionnel)"
        rows={2}
        className="w-full rounded-lg border border-ink-900/10 p-2 text-sm"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="button" variant="danger" size="sm" disabled={pending} onClick={confirmer}>
          {pending ? "Annulation..." : "Confirmer l'annulation"}
        </Button>
        <Button type="button" variant="secondary" size="sm" disabled={pending} onClick={() => setOuvert(false)}>
          Retour
        </Button>
      </div>
    </div>
  );
}
