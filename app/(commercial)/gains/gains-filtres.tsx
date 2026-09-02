"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { formatFCFA } from "@/lib/utils";
import { HistoriqueGains } from "./historique-gains";
import type { Payment } from "@/types/database";

type Vue = "ventes" | "parrainage";

interface ResumeParrainage {
  points: number;
  filleulsActifs: number;
  niveau: string;
  valeurPoint: number;
  bonusEstime: number;
}

export function GainsFiltres({
  paymentsRecent,
  enAttente,
  dejaPaye,
  resumeParrainage,
}: {
  paymentsRecent: Payment[];
  enAttente: number;
  dejaPaye: number;
  resumeParrainage: ResumeParrainage;
}) {
  const [vue, setVue] = useState<Vue>("ventes");

  return (
    <div className="space-y-4">
      <select
        value={vue}
        onChange={(e) => setVue(e.target.value as Vue)}
        className="h-10 w-full max-w-xs rounded-xl border border-ink-900/10 bg-surface px-3 text-sm"
      >
        <option value="ventes">💰 Gains sur mes ventes</option>
        <option value="parrainage">🤝 Gains de parrainage</option>
      </select>

      {vue === "ventes" ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Card><CardTitle>En attente de paiement</CardTitle><CardValue>{formatFCFA(enAttente)}</CardValue></Card>
            <Card><CardTitle>Déjà payé (total)</CardTitle><CardValue className="text-emerald-600">{formatFCFA(dejaPaye)}</CardValue></Card>
          </div>
          <p className="text-xs text-ink-900/40">Historique ci-dessous limité aux 3 derniers mois (le total "Déjà payé" ci-dessus reste sur l'ensemble de l'historique).</p>
          <HistoriqueGains payments={paymentsRecent} />
        </>
      ) : (
        <Card className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-ink-900/50">Points ce mois</p>
              <p className="text-xl font-semibold">{resumeParrainage.points}</p>
            </div>
            <div>
              <p className="text-xs text-ink-900/50">Filleuls actifs</p>
              <p className="text-xl font-semibold">{resumeParrainage.filleulsActifs}</p>
            </div>
            <div>
              <p className="text-xs text-ink-900/50">Niveau actuel</p>
              <p className="text-xl font-semibold">{resumeParrainage.niveau}</p>
            </div>
            <div>
              <p className="text-xs text-ink-900/50">Bonus estimé</p>
              <p className="text-xl font-semibold text-terracotta-600">{formatFCFA(resumeParrainage.bonusEstime)}</p>
            </div>
          </div>
          <Link href="/parrainage" className="block rounded-xl bg-terracotta-500 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-terracotta-600">
            Voir plus — tous les détails du parrainage →
          </Link>
        </Card>
      )}
    </div>
  );
}
