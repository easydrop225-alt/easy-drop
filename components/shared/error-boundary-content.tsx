"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

/**
 * Contenu partagé des 3 écrans error.tsx (commercial/admin/public) — pour
 * ne pas dupliquer 3 fois la même logique d'alerte. Prévient
 * automatiquement les admins par notification push dès qu'une vraie
 * erreur survient, via /api/log-error (réutilise l'infrastructure de
 * notifications déjà existante).
 */
export function ErrorBoundaryContent({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const pathname = usePathname();

  useEffect(() => {
    console.error(error);
    fetch("/api/log-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: error.message, digest: error.digest, page: pathname }),
    }).catch(() => {
      // Si même l'alerte échoue, on n'en fait pas plus — la personne voit
      // déjà le message d'erreur ci-dessous.
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
