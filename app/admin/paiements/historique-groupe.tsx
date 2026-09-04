"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatFCFA, formatDate } from "@/lib/utils";
import { exporterCSV } from "@/lib/export-csv";
import { VoirCommandesVersementBouton } from "./voir-commandes-versement-bouton";
import { FiltreDate, correspondAuFiltre, type FiltreDateValeur } from "@/components/commandes/filtre-date";
import type { Payment, Profile } from "@/types/database";

type PaymentAvecCommercial = Payment & { profiles: Pick<Profile, "nom" | "prenom" | "nom_boutique"> };

export function HistoriqueVersementsGroupe({ payments }: { payments: PaymentAvecCommercial[] }) {
  const [filtre, setFiltre] = useState<FiltreDateValeur>({ annee: new Date().getFullYear(), mois: null, jour: null });

  const dates = useMemo(() => payments.map((p) => p.date_paiement), [payments]);
  const filtres = useMemo(() => payments.filter((p) => correspondAuFiltre(p.date_paiement, filtre)), [payments, filtre]);

  const groupes = useMemo(() => {
    const map = new Map<string, { nom: string; nomBoutique: string | null; versements: PaymentAvecCommercial[] }>();
    for (const p of filtres) {
      const nom = `${p.profiles?.prenom ?? "?"} ${p.profiles?.nom ?? ""}`.trim();
      if (!map.has(p.commercial_id)) map.set(p.commercial_id, { nom, nomBoutique: p.profiles?.nom_boutique ?? null, versements: [] });
      map.get(p.commercial_id)!.versements.push(p);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].versements.length - a[1].versements.length);
  }, [filtres]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <FiltreDate dates={dates} valeur={filtre} onChange={setFiltre} />
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            const lignes = filtres.map((p) => [
              formatDate(p.date_paiement),
              `${p.profiles?.prenom ?? ""} ${p.profiles?.nom ?? ""}`.trim(),
              p.profiles?.nom_boutique ?? "",
              p.montant,
              p.mode,
              p.statut,
              p.reference_paiement ?? "",
            ]);
            exporterCSV("easydrop-paiements", ["Date", "Commercial", "Boutique", "Montant", "Mode", "Statut", "Référence"], lignes);
          }}
        >
          📊 Exporter CSV
        </Button>
      </div>

      {groupes.length === 0 && (
        <Card><p className="text-sm text-ink-900/50">Aucun paiement enregistré pour cette période.</p></Card>
      )}

      {groupes.map(([commercialId, groupe]) => {
        const total = groupe.versements.reduce((a, p) => a + Number(p.montant), 0);
        return (
          <Card key={commercialId} className="p-0">
            <div className="flex items-center justify-between border-b border-ink-900/5 px-4 py-3">
              <p className="font-medium">
                {groupe.nom}
                {groupe.nomBoutique && <span className="ml-2 rounded-full bg-beige-100 px-2 py-0.5 text-xs font-normal">🏪 {groupe.nomBoutique}</span>}
              </p>
              <p className="text-sm text-ink-900/60">{groupe.versements.length} versement(s) — Déjà payé : <span className="font-medium text-emerald-600">{formatFCFA(total)}</span></p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-900/5 text-left text-ink-900/50">
                  <th className="p-3">Date</th>
                  <th className="p-3">Montant</th>
                  <th className="p-3">Mode</th>
                  <th className="p-3">Référence</th>
                  <th className="p-3">Preuve</th>
                  <th className="p-3">Statut</th>
                </tr>
              </thead>
              <tbody>
                {groupe.versements.map((p) => (
                  <tr key={p.id} className="border-b border-ink-900/5 last:border-0">
                    <td className="p-3">{formatDate(p.date_paiement)}</td>
                    <td className="p-3">{formatFCFA(p.montant)}</td>
                    <td className="p-3">{p.mode}</td>
                    <td className="p-3">{p.reference_paiement ?? "—"}</td>
                    <td className="p-3">
                      {p.preuve_url ? (
                        <a href={p.preuve_url} target="_blank" rel="noreferrer" className="text-terracotta-600 underline">Voir</a>
                      ) : "—"}
                    </td>
                    <td className="p-3">
                      <span className={p.statut === "paye" ? "font-medium text-emerald-600" : "text-ink-900/60"}>
                        {p.statut === "paye" ? "✓ Payé" : p.statut}
                      </span>
                      {p.statut === "paye" && (
                        <div className="mt-1">
                          <VoirCommandesVersementBouton paymentId={p.id} />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        );
      })}
    </div>
  );
}
