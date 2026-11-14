"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * Détecte l'état de la connexion réseau et renvoie automatiquement le
 * formulaire dès que la connexion revient si l'envoi avait été mis en
 * attente (voir surSoumission dans le formulaire principal).
 *
 * Attention (bug du 14/11/2026, erreur React #485 « Cannot update action
 * state while rendering ») : le renvoi ne doit JAMAIS être déclenché depuis
 * une fonction de mise à jour d'état (setX((v) => ...)), car React l'exécute
 * pendant le rendu. On garde donc l'information « envoi en attente » dans
 * une ref et on renvoie le formulaire en dehors du rendu.
 */
export function useConnexionCommande(formRef: RefObject<HTMLFormElement | null>) {
  const [enLigne, setEnLigne] = useState(true);
  const [envoiEnAttenteReconnexion, setEnAttente] = useState(false);
  const enAttenteRef = useRef(false);

  function setEnvoiEnAttenteReconnexion(v: boolean) {
    enAttenteRef.current = v;
    setEnAttente(v);
  }

  useEffect(() => {
    setEnLigne(navigator.onLine);
    function surConnexion() {
      setEnLigne(true);
      if (!enAttenteRef.current) return;
      enAttenteRef.current = false;
      setEnAttente(false);
      // hors du rendu React : laisse d'abord passer la mise à jour de l'écran
      window.setTimeout(() => formRef.current?.requestSubmit(), 0);
    }
    function surDeconnexion() {
      setEnLigne(false);
    }
    window.addEventListener("online", surConnexion);
    window.addEventListener("offline", surDeconnexion);
    return () => {
      window.removeEventListener("online", surConnexion);
      window.removeEventListener("offline", surDeconnexion);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { enLigne, envoiEnAttenteReconnexion, setEnvoiEnAttenteReconnexion };
}
