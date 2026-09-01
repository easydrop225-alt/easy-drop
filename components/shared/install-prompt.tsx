"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { X, Share, PlusSquare } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Bannière invitant à installer Easy Drop sur l'écran d'accueil.
 * - Android / Chrome / Edge : utilise l'invite native du navigateur
 *   (événement "beforeinstallprompt").
 * - iPhone / Safari : ce navigateur ne propose pas d'invite automatique,
 *   on affiche donc des instructions manuelles (Partager > Ajouter à
 *   l'écran d'accueil).
 *
 * Comportement voulu : tant que l'application n'est PAS installée, la
 * bannière peut être fermée temporairement, mais réapparaît à chaque
 * nouvelle page visitée (elle ne bloque jamais la navigation — c'est un
 * simple bandeau, pas une fenêtre qui empêche de cliquer ailleurs). Une
 * fois l'app réellement installée (mode standalone détecté), elle ne
 * s'affiche plus jamais.
 *
 * Juste après une inscription réussie (URL avec ?bienvenue=1), la fenêtre
 * d'installation native s'ouvre automatiquement si le navigateur le permet
 * — la seule action qui reste au commercial est de confirmer dans la
 * fenêtre du navigateur (aucun navigateur ne permet d'installer une
 * application sans cette confirmation manuelle, c'est une règle de
 * sécurité universelle, pas une limite propre à Easy Drop).
 */
export function InstallPrompt() {
  const [eventInstall, setEventInstall] = useState<BeforeInstallPromptEvent | null>(null);
  const [estIOS, setEstIOS] = useState(false);
  const [visible, setVisible] = useState(false);
  const [dejaInstalle, setDejaInstalle] = useState(false);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const justeApresInscription = searchParams.get("bienvenue") === "1";

  // Capture l'événement du navigateur une seule fois (il ne se redéclenche
  // pas à chaque page) et détecte iOS/l'installation déjà faite.
  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setDejaInstalle(true);
      return;
    }

    const ua = window.navigator.userAgent;
    setEstIOS(/iPhone|iPad|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream);

    function handler(e: Event) {
      e.preventDefault();
      const evt = e as BeforeInstallPromptEvent;
      setEventInstall(evt);
      setVisible(true);
      if (justeApresInscription) {
        evt.prompt();
        evt.userChoice.finally(() => setVisible(false));
      }
    }
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ré-affiche la bannière à chaque changement de page, tant que
  // l'application n'est pas installée (même si elle avait été fermée sur
  // la page précédente).
  useEffect(() => {
    if (dejaInstalle) { setVisible(false); return; }
    if (estIOS || eventInstall) setVisible(true);
  }, [pathname, dejaInstalle, estIOS, eventInstall]);

  function fermer() {
    setVisible(false);
  }

  async function installer() {
    if (!eventInstall) return;
    await eventInstall.prompt();
    const choix = await eventInstall.userChoice;
    if (choix.outcome === "accepted") setDejaInstalle(true);
    setVisible(false);
  }

  if (!visible || dejaInstalle) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-2xl border border-ink-900/10 bg-surface p-4 shadow-lg">
      <button onClick={fermer} className="absolute right-3 top-3 text-ink-900/40 hover:text-ink-900" aria-label="Fermer">
        <X size={18} />
      </button>
      {estIOS ? (
        <div className="pr-6 text-sm">
          <p className="font-medium">
            {justeApresInscription ? "Bienvenue ! Installe Easy Drop sur ton écran d'accueil" : "Installer Easy Drop sur ton écran d'accueil"}
          </p>
          <p className="mt-1 flex items-center gap-1 text-ink-900/60">
            Appuie sur <Share size={14} className="inline" /> puis sur <PlusSquare size={14} className="inline" /> "Sur l'écran d'accueil".
          </p>
        </div>
      ) : (
        <div className="pr-6 text-sm">
          <p className="font-medium">{justeApresInscription ? "Bienvenue ! Confirme l'installation" : "Installer Easy Drop"}</p>
          <p className="mt-1 text-ink-900/60">Accède plus rapidement à l'application depuis ton écran d'accueil.</p>
          <button
            onClick={installer}
            className="mt-3 rounded-xl bg-terracotta-500 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-600"
          >
            Installer
          </button>
        </div>
      )}
    </div>
  );
}
