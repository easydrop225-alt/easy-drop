"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { validerSuppressionCommande, refuserSuppressionCommande } from "../actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function SuppressionBanner({
  orderId,
  motif,
}: {
  orderId: string;
  motif: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleValider() {
    setError(null);
    startTransition(async () => {
      const res = await validerSuppressionCommande(orderId);
      if (res?.error) setError(res.error);
      else router.push("/commandes");
    });
  }

  function handleRefuser() {
    setError(null);
    startTransition(async () => {
      const res = await refuserSuppressionCommande(orderId);
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <Card className="border-2 border-amber-400 bg-amber-50">
      <p className="font-medium text-amber-800">
        L&apos;administration souhaite supprimer cette commande.
      </p>
      {motif && <p className="mt-1 text-sm text-amber-700">Motif : {motif}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="danger" disabled={pending} onClick={handleValider}>
          {pending ? "..." : "Confirmer la suppression"}
        </Button>
        <Button size="sm" variant="secondary" disabled={pending} onClick={handleRefuser}>
          Refuser
        </Button>
      </div>
    </Card>
  );
}
