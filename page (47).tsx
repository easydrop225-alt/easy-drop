"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { formatFCFA, formatDate } from "@/lib/utils";
import { FiltreDate, correspondAuFiltre, type FiltreDateValeur } from "@/components/commandes/filtre-date";
import type { Payment } from "@/types/database";

export function HistoriqueGains({ payments }: { payments: Payment[] }) {
  const [filtre, setFiltre] = useState<FiltreDateValeur>({ annee: new Date().getFullYear(), mois: null, jour: null });

  const dates = useMemo(() => payments.map((p) => p.date_paiement), [payments]);
  const filtres = useMemo(() => payments.filter((p) => correspondAuFiltre(p.date_paiement, filtre)), [payments, filtre]);

  return (
    <div className="space-y-4">
      <FiltreDate dates={dates} valeur={filtre} onChange={setFiltre} />

      <Card className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-900/5 text-left text-ink-900/50">
              <th className="p-3">Date</th>
              <th className="p-3">Montant</th>
              <th className="p-3">Mode</th>
              <th className="p-3">Statut</th>
              <th className="p-3">Preuve</th>
            </tr>
          </thead>
          <tbody>
            {filtres.map((p) => (
              <tr key={p.id} className="border-b border-ink-900/5 last:border-0">
                <td className="p-3">{formatDate(p.date_paiement)}</td>
                <td className="p-3">{formatFCFA(p.montant)}</td>
                <td className="p-3">{p.mode}</td>
                <td className="p-3">
                  <span className={p.statut === "paye" ? "font-medium text-emerald-600" : "text-ink-900/60"}>
                    {p.statut === "paye" ? "✓ Payé" : p.statut}
                  </span>
                </td>
                <td className="p-3">
                  {p.preuve_url ? (
                    <a href={p.preuve_url} download target="_blank" rel="noreferrer" className="text-terracotta-600 underline">
                      Voir / Télécharger
                    </a>
                  ) : "—"}
                </td>
              </tr>
            ))}
            {filtres.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-ink-900/40">Aucun paiement pour cette période.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
