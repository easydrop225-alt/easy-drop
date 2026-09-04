"use client";

import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { formatFCFA } from "@/lib/utils";
import { HistoriqueGains } from "./historique-gains";
import type { Payment } from "@/types/database";

export function GainsFiltres({
  paymentsRecent,
  enAttente,
  dejaPaye,
}: {
  paymentsRecent: Payment[];
  enAttente: number;
  dejaPaye: number;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card><CardTitle>En attente de paiement</CardTitle><CardValue>{formatFCFA(enAttente)}</CardValue></Card>
        <Card><CardTitle>Déjà payé (total)</CardTitle><CardValue className="text-emerald-600">{formatFCFA(dejaPaye)}</CardValue></Card>
      </div>
      <p className="text-xs text-ink-900/40">Historique ci-dessous limité aux 3 derniers mois (le total "Déjà payé" ci-dessus reste sur l'ensemble de l'historique).</p>
      <HistoriqueGains payments={paymentsRecent} />
    </div>
  );
}
