"use client";

import { Button } from "@/components/ui/button";

export function ImprimerBouton() {
  return (
    <Button size="sm" onClick={() => window.print()}>
      🖨️ Imprimer le bon
    </Button>
  );
}
