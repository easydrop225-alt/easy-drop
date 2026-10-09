"use client";

import { Button } from "@/components/ui/button";
import { changerStatutCommande } from "../../actions";
import type { OrderStatut } from "@/types/database";

export function ImprimerBouton({ orderId, statutActuel }: { orderId: string; statutActuel: OrderStatut }) {
  function handleImprimer() {
    // Tirer le bon = le colis part avec le livreur : la commande passe
    // directement "En cours de livraison". Seulement depuis "confirmation"
    // ou "traitement" — une commande déjà livrée, relancée ou annulée ne
    // doit pas changer juste parce qu'on réimprime le bon.
    if (statutActuel === "confirmation" || statutActuel === "traitement") {
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
