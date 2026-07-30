"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopierLienBouton({ lien }: { lien: string }) {
  const [copie, setCopie] = useState(false);

  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={async () => {
        await navigator.clipboard.writeText(lien);
        setCopie(true);
        setTimeout(() => setCopie(false), 2000);
      }}
    >
      {copie ? "Copié ✓" : "Copier"}
    </Button>
  );
}
