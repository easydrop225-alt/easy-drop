"use client";

import { useTransition } from "react";
import { enregistrerVersementParrainage } from "./actions";
import { Button } from "@/components/ui/button";

export function MarquerPayeParrainageBouton({ parrainId, mois, montant }: { parrainId: string; mois: string; montant: number }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => {
        enregistrerVersementParrainage({ parrainId, mois, montant, mode: "wave" });
      })}
    >
      {pending ? "..." : "Marquer payé"}
    </Button>
  );
}
