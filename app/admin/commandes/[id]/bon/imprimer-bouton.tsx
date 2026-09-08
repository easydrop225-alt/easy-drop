"use client";

import { Button } from "@/components/ui/button";
import { changerStatutCommande } from "../../actions";
import type { OrderStatut } from "@/types/database";

export function ImprimerBouton({ orderId, statutActuel }: { orderId: string; statutActuel: OrderStatut }) {
  function handleImprimer() {
    // Tirer le bon vaut confirmation que la commande passe en traitement —
    // uniquement depuis "confirmation" (une commande déjà avancée, relancée
    // ou annulée ne doit pas reculer/changer juste parce qu'on réimprime).
    if (statutActuel === "confirmation") {
      changerStatutCommande(orderId, "traitement");
    }
    window.print();
  }

  return (
    <Button size="sm" onClick={handleImprimer}>
      🖨️ Imprimer le bon
    </Button>
  );
}
