"use client";

import { Button } from "@/components/ui/button";
import { changerStatutCommande } from "../../actions";
import type { OrderStatut } from "@/types/database";

export function ImprimerBouton({ orderId, statutActuel }: { orderId: string; statutActuel: OrderStatut }) {
  function handleImprimer() {
    // Tirer le bon = le colis part avec le livreur : la commande passe
    // directement "En cours de livraison". Depuis "confirmation",
    // "traitement" ou "relance" (relance imprimée le jour J) — une commande
    // déjà livrée ou annulée ne change pas si on réimprime le bon.
    if (statutActuel === "confirmation" || statutActuel === "traitement" || statutActuel === "relance") {
      changerStatutCommande(orderId, "livraison");
    }
    window.print();
  }

  return (
    <Button size="sm" onClick={handleImprimer}>
      🖨️ Imprimer le bon
    </Button>
  );
}
