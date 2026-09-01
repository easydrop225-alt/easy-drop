"use client";

import { useState } from "react";
import { reinitialiserMotDePasseCommercial } from "@/app/admin/commerciaux/actions";
import { Button } from "@/components/ui/button";

export function BoutonReinitialiserMotDePasse({ commercialId, nomComplet }: { commercialId: string; nomComplet: string }) {
  const [enCours, setEnCours] = useState(false);
  const [resultat, setResultat] = useState<{ motDePasseTemporaire?: string; error?: string } | null>(null);

  async function declencher() {
    if (!confirm(`Réinitialiser le mot de passe de ${nomComplet} ? L'ancien mot de passe ne fonctionnera plus.`)) return;
    setEnCours(true);
    const res = await reinitialiserMotDePasseCommercial(commercialId);
    setResultat(res);
    setEnCours(false);
  }

  if (resultat?.motDePasseTemporaire) {
    return (
      <div className="rounded-lg bg-terracotta-50 p-2 text-xs">
        <p className="mb-1 text-ink-900/60">Nouveau mot de passe (à transmettre à {nomComplet}) :</p>
        <div className="flex items-center gap-2">
          <code className="rounded bg-surface px-2 py-1 font-mono">{resultat.motDePasseTemporaire}</code>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(resultat.motDePasseTemporaire!)}
            className="text-terracotta-600 underline"
          >
            Copier
          </button>
        </div>
        <button type="button" onClick={() => setResultat(null)} className="mt-1 text-ink-900/40 underline">
          Fermer
        </button>
      </div>
    );
  }

  return (
    <div>
      <Button size="sm" variant="secondary" onClick={declencher} disabled={enCours}>
        {enCours ? "..." : "Réinitialiser mot de passe"}
      </Button>
      {resultat?.error && <p className="mt-1 text-xs text-red-600">{resultat.error}</p>}
    </div>
  );
}
