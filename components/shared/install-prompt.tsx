"use client";

import { useEffect, useState } from "react";
import { X, Share, PlusSquare } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const CLE_MASQUE = "easydrop_install_masque";

/**
 * Bannière discrète invitant à installer Easy Drop sur l'écran d'accueil.
 * - Android / Chrome / Edge : utilise l'invite native du navigateur
 *   (événement "beforeinstallprompt").
 * - iPhone / Safari : ce navigateur ne propose pas d'invite automatique,
 *   on affiche donc des instructions manuelles (Partager > Ajouter à
 *   l'écran d'accueil).
 * Le bandeau ne s'affiche qu'une fois par appareil (mémorisé localement)
 * et peut être fermé à tout moment.
 */
export function InstallPrompt() {
  const [eventInstall, setEventInstall] = useState<BeforeInstallPromptEvent | null>(null);
  const [estIOS, setEstIOS] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(CLE_MASQUE) === "1") return;

    const dejaInstalle = window.matchMedia("(display-mode: standalone)").matches;
    if (dejaInstalle) return;

    const ua = window.navigator.userAgent;
    const iOS = /iPhone|iPad|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setEstIOS(iOS);

    function handler(e: Event) {
      e.preventDefault();
      setEventInstall(e as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", handler);

    // Sur iOS, il n'y a pas d'événement "beforeinstallprompt" : on affiche
    // directement les instructions manuelles après un court délai.
    if (iOS) {
      const t = setTimeout(() => setVisible(true), 2000);
      return () => { clearTimeout(t); window.removeEventListener("beforeinstallprompt", handler); };
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function fermer() {
    setVisible(false);
    localStorage.setItem(CLE_MASQUE, "1");
  }

  async function installer() {
    if (!eventInstall) return;
    await eventInstall.prompt();
    await eventInstall.userChoice;
    setVisible(false);
    localStorage.setItem(CLE_MASQUE, "1");
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-2xl border border-ink-900/10 bg-white p-4 shadow-lg">
      <button onClick={fermer} className="absolute right-3 top-3 text-ink-900/40 hover:text-ink-900">
        <X size={18} />
      </button>
      {estIOS ? (
        <div className="pr-6 text-sm">
          <p className="font-medium">Installer Easy Drop sur ton écran d'accueil</p>
          <p className="mt-1 flex items-center gap-1 text-ink-900/60">
            Appuie sur <Share size={14} className="inline" /> puis sur <PlusSquare size={14} className="inline" /> "Sur l'écran d'accueil".
          </p>
        </div>
      ) : (
        <div className="pr-6 text-sm">
          <p className="font-medium">Installer Easy Drop</p>
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
