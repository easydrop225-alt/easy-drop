"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const CLE = "easydrop-historique";
const MAX = 60;

function lire(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(CLE) ?? "[]");
  } catch {
    return [];
  }
}
function ecrire(pile: string[]) {
  try {
    sessionStorage.setItem(CLE, JSON.stringify(pile.slice(-MAX)));
  } catch {
    /* stockage indisponible : le bouton retombera sur l'accueil */
  }
}

/**
 * Bouton « Retour » précis : l'appli garde elle-même la liste des pages
 * visitées dans l'onglet (pile), au lieu de dépendre de l'historique du
 * navigateur — qui, dans l'appli installée sur téléphone, est souvent vide
 * ou incomplet (ouverture depuis une notification, redirections…). Un appui
 * ramène exactement à la page d'avant, avec ses filtres (paramètres d'URL).
 * Masqué sur la page d'accueil de l'espace et à l'impression.
 */
function BoutonRetourInterne({ accueil }: { accueil: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const qs = params.toString();
  const ici = qs ? `${pathname}?${qs}` : pathname;

  // Enregistre chaque page visitée. Si on arrive sur la page juste avant
  // la courante (retour), on dépile au lieu d'empiler.
  useEffect(() => {
    const pile = lire();
    if (pile[pile.length - 1] === ici) return;
    if (pile[pile.length - 2] === ici) pile.pop();
    else pile.push(ici);
    ecrire(pile);
  }, [ici]);

  if (pathname === accueil || ["/", "/admin", "/fournisseur"].includes(pathname)) return null;

  function retour() {
    const pile = lire();
    while (pile.length && pile[pile.length - 1] === ici) pile.pop();
    const precedente = pile[pile.length - 1];
    ecrire(pile);
    router.push(precedente ?? accueil);
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

export function BoutonRetour({ accueil }: { accueil: string }) {
  return (
    <Suspense fallback={null}>
      <BoutonRetourInterne accueil={accueil} />
    </Suspense>
  );
}
