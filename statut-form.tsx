"use client";

import { useState, useTransition } from "react";
import { supprimerProduit } from "./actions";

export function SupprimerProduitButton({ productId, nomProduit }: { productId: string; nomProduit: string }) {
  const [pending, startTransition] = useTransition();
  const [confirmation, setConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!confirmation) {
    return (
      <button onClick={() => setConfirmation(true)} className="text-red-600 underline">
        Supprimer
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-xs text-ink-900/60">Supprimer « {nomProduit} » ?</span>
      <button
        disabled={pending}
        onClick={() => startTransition(async () => {
          const res = await supprimerProduit(productId);
          if (res?.error) setError(res.error);
        })}
        className="font-medium text-red-600 underline"
      >
        {pending ? "..." : "Confirmer"}
      </button>
      <button onClick={() => setConfirmation(false)} className="text-ink-900/50 underline">Annuler</button>
      {error && <span className="text-red-600">{error}</span>}
    </span>
  );
}
