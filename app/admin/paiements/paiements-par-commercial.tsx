"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { formatDate, formatFCFA } from "@/lib/utils";
import { VoirCommandesVersementBouton } from "./voir-commandes-versement-bouton";
import type { Payment, Profile } from "@/types/database";

export type PaiementEffectue = Pick<Payment, "id" | "commercial_id" | "montant" | "mode" | "date_paiement" | "reference_paiement" | "preuve_url"> & {
  profiles: Pick<Profile, "nom" | "prenom" | "nom_boutique" | "created_at"> | null;
};

const MODES: Record<string, string> = { wave: "Wave", orange_money: "Orange Money", especes: "Espèces" };

/**
 * Menu déroulant : on choisit un commercial et on voit TOUS les paiements
 * qu'il a reçus depuis son arrivée sur la plateforme (pas de limite de
 * 3 mois, contrairement à l'historique plus bas).
 */
export function PaiementsParCommercial({ paiements }: { paiements: PaiementEffectue[] }) {
  const [commercialId, setCommercialId] = useState("");

  const commerciaux = useMemo(() => {
    const map = new Map<string, { nom: string; total: number; nb: number }>();
    for (const p of paiements) {
      const nom = `${p.profiles?.prenom ?? "?"} ${p.profiles?.nom ?? ""}`.trim();
      const c = map.get(p.commercial_id) ?? { nom, total: 0, nb: 0 };
      c.total += Number(p.montant);
      c.nb += 1;
      map.set(p.commercial_id, c);
    }
    return Array.from(map.entries()).sort((a, b) => a[1].nom.localeCompare(b[1].nom));
  }, [paiements]);

  const selection = useMemo(
    () => paiements.filter((p) => p.commercial_id === commercialId).sort((a, b) => b.date_paiement.localeCompare(a.date_paiement)),
    [paiements, commercialId],
  );
  const infos = commerciaux.find(([id]) => id === commercialId)?.[1];
  const profil = selection[0]?.profiles;

  return (
    <div>
      <h2 className="mb-1 text-lg font-medium">Paiements effectués par commercial</h2>
      <p className="mb-3 text-xs text-ink-900/40">Tous les paiements reçus depuis l'inscription sur la plateforme.</p>
      <select
        value={commercialId}
        onChange={(e) => setCommercialId(e.target.value)}
        className="h-10 w-full max-w-md rounded-xl border border-ink-900/10 bg-surface px-3 text-sm"
      >
        <option value="">— Choisir un commercial —</option>
        {commerciaux.map(([id, c]) => (
          <option key={id} value={id}>
            {c.nom} — {c.nb} paiement{c.nb > 1 ? "s" : ""} · {formatFCFA(c.total)}
          </option>
        ))}
      </select>

      {commercialId && infos && (
        <Card className="mt-3 p-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-900/5 px-4 py-3">
            <div>
              <p className="font-medium">
                {infos.nom}
                {profil?.nom_boutique && <span className="ml-2 rounded-full bg-beige-100 px-2 py-0.5 text-xs font-normal">🏪 {profil.nom_boutique}</span>}
              </p>
              {profil?.created_at && <p className="text-xs text-ink-900/50">Sur la plateforme depuis le {formatDate(profil.created_at)}</p>}
            </div>
            <p className="text-sm text-ink-900/60">
              {infos.nb} paiement{infos.nb > 1 ? "s" : ""} — Total reçu : <span className="font-semibold text-emerald-600">{formatFCFA(infos.total)}</span>
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-900/5 text-left text-ink-900/50">
                  <th className="p-3">Date</th>
                  <th className="p-3">Montant</th>
                  <th className="p-3">Mode</th>
                  <th className="p-3">Numéro</th>
                  <th className="p-3">Preuve</th>
                  <th className="p-3">Commandes</th>
                </tr>
              </thead>
              <tbody>
                {selection.map((p) => (
                  <tr key={p.id} className="border-b border-ink-900/5 align-top last:border-0">
                    <td className="p-3 whitespace-nowrap">{formatDate(p.date_paiement)}</td>
                    <td className="p-3 whitespace-nowrap font-medium">{formatFCFA(Number(p.montant))}</td>
                    <td className="p-3">{MODES[p.mode] ?? p.mode}</td>
                    <td className="p-3">{p.reference_paiement ?? "—"}</td>
                    <td className="p-3">
                      {p.preuve_url ? <a href={p.preuve_url} target="_blank" rel="noreferrer" className="text-terracotta-600 underline">Voir</a> : "—"}
                    </td>
                    <td className="p-3"><VoirCommandesVersementBouton paymentId={p.id} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {commerciaux.length === 0 && (
        <Card className="mt-3"><p className="text-sm text-ink-900/50">Aucun paiement effectué pour l'instant.</p></Card>
      )}
    </div>
  );
}
