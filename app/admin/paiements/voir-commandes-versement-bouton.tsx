"use client";

import { useState, useTransition } from "react";
import { listerCommandesDunVersement } from "./actions";
import { formatFCFA } from "@/lib/utils";

/**
 * Petit bouton discret, sans rien agrandir dans la mise en page — au clic,
 * ouvre juste une liste compacte des commandes couvertes par ce versement
 * précis, directement sous la ligne.
 */
export function VoirCommandesVersementBouton({ paymentId }: { paymentId: string }) {
  const [ouvert, setOuvert] = useState(false);
  const [commandes, setCommandes] = useState<{ numeroCommande: string; montant: number }[] | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle() {
    if (ouvert) {
      setOuvert(false);
      return;
    }
    setOuvert(true);
    if (commandes === null) {
      startTransition(async () => {
        const res = await listerCommandesDunVersement(paymentId);
        setCommandes(res);
      });
    }
  }

  return (
    <>
      <button type="button" onClick={toggle} className="text-xs text-terracotta-600 underline">
        {ouvert ? "Masquer" : "Voir les commandes"}
      </button>
      {ouvert && (
        <div className="mt-1 rounded-lg bg-beige-100 p-2 text-xs">
          {pending && <p className="text-ink-900/50">Chargement...</p>}
          {commandes && commandes.length === 0 && <p className="text-ink-900/50">Aucune commande liée trouvée.</p>}
          {commandes && commandes.length > 0 && (
            <ul className="space-y-0.5">
              {commandes.map((c) => (
                <li key={c.numeroCommande} className="flex justify-between gap-3">
                  <span>{c.numeroCommande}</span>
                  <span className="font-medium">{formatFCFA(c.montant)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}
