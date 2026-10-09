"use client";

import { usePathname, useRouter } from "next/navigation";

/**
 * Bouton « Retour » : l'appli installée sur téléphone (PWA) n'a pas de
 * bouton retour du navigateur. Revient à la page précédente ; s'il n'y en
 * a pas (appli ouverte directement sur cette page), renvoie à l'accueil
 * de l'espace. Masqué sur la page d'accueil elle-même et à l'impression.
 */
export function BoutonRetour({ accueil }: { accueil: string }) {
  const router = useRouter();
  const pathname = usePathname();

  if (pathname === accueil || ["/", "/admin", "/fournisseur"].includes(pathname)) return null;

  function retour() {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push(accueil);
  }

  return (
    <button
      type="button"
      onClick={retour}
      className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-ink-900/10 bg-surface px-3 py-1.5 text-sm font-medium text-ink-900/70 shadow-sm transition hover:text-ink-900 active:scale-95 print:hidden"
      aria-label="Retour à la page précédente"
    >
      <span aria-hidden>←</span> Retour
    </button>
  );
}
