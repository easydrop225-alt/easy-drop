"use client";

import { useState, useTransition } from "react";
import { modifierFraisLivraison } from "../actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function LivraisonForm({ orderId, fraisActuel }: { orderId: string; fraisActuel: number }) {
  const [frais, setFrais] = useState(fraisActuel);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleValider() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await modifierFraisLivraison(orderId, frais);
      if (res?.error) setError(res.error);
      else setSaved(true);
    });
  }

  return (
    <div>
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Input type="number" min={0} value={frais} onChange={(e) => setFrais(Number(e.target.value))} />
        </div>
        <Button size="sm" disabled={pending} onClick={handleValider}>
          {pending ? "Enregistrement..." : "Corriger le prix de livraison"}
        </Button>
        {saved && <span className="text-sm text-emerald-600">Enregistré ✓</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
      <p className="mt-1 text-xs text-ink-900/50">
        Le prix total payé par le client ne change pas : la différence est automatiquement retirée du prix de vente (et donc du bénéfice du commercial), jamais ajoutée en plus.
      </p>
    </div>
  );
}
