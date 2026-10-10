"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { marquerBonImprime } from "../../actions";
import type { OrderStatut } from "@/types/database";

export function ImprimerBouton({ orderId, statutActuel }: { orderId: string; statutActuel: OrderStatut }) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);

  async function handleImprimer() {
    // Tirer le bon = le colis part avec le livreur : la commande bascule
    // « En cours de livraison » AVANT l'ouverture de l'impression (depuis
    // confirmation, traitement ou relance). On attend la confirmation de
    // la base, sinon sur téléphone la fenêtre d'impression pouvait couper
    // la requête et le statut ne changeait pas. Une commande déjà livrée ou
    // annulée ne change pas si on réimprime le bon.
    if (["confirmation", "traitement", "relance"].includes(statutActuel)) {
      setEnCours(true);
      await marquerBonImprime(orderId);
      setEnCours(false);
      router.refresh();
    }
    window.print();
  }

  return (
    <Button size="sm" onClick={handleImprimer} disabled={enCours}>
      {enCours ? "Mise en livraison…" : "🖨️ Imprimer le bon"}
    </Button>
  );
}
