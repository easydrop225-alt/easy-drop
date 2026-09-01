"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-4xl">😕</p>
      <h2 className="text-lg font-semibold">Une erreur est survenue</h2>
      <p className="max-w-sm text-sm text-ink-900/60">
        Quelque chose s&apos;est mal passé en chargeant cette page. Réessaie — si ça persiste, contacte le support.
      </p>
      <Button onClick={() => reset()}>Réessayer</Button>
    </div>
  );
}
