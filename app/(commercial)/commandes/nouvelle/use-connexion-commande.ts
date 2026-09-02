"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Détecte l'état de la connexion réseau et renvoie automatiquement le
 * formulaire dès que la connexion revient si l'envoi avait été mis en
 * attente (voir surSoumission dans le formulaire principal).
 */
export function useConnexionCommande(formRef: RefObject<HTMLFormElement | null>) {
  const [enLigne, setEnLigne] = useState(true);
  const [envoiEnAttenteReconnexion, setEnvoiEnAttenteReconnexion] = useState(false);

  useEffect(() => {
    setEnLigne(navigator.onLine);
    function surConnexion() {
      setEnLigne(true);
      setEnvoiEnAttenteReconnexion((enAttente) => {
        if (enAttente) formRef.current?.requestSubmit();
        return false;
      });
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
