"use client";

import { useMemo, useState } from "react";
import { StatutBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { FiltreDate, correspondAuFiltre, type FiltreDateValeur } from "./filtre-date";
import type { Order } from "@/types/database";

export function HistoriqueCommandesCommercial({ orders }: { orders: Order[] }) {
  const [filtre, setFiltre] = useState<FiltreDateValeur>({ annee: new Date().getFullYear(), mois: null, jour: null });

  const dates = useMemo(() => orders.map((o) => o.created_at), [orders]);
  const filtrees = useMemo(() => orders.filter((o) => correspondAuFiltre(o.created_at, filtre)), [orders, filtre]);

  return (
    <div className="space-y-4">
      <FiltreDate dates={dates} valeur={filtre} onChange={setFiltre} />

      <Card className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-900/5 text-left text-ink-900/50">
              <th className="p-3">Numéro</th>
              <th className="p-3">Client</th>
              <th className="p-3">Commune</th>
              <th className="p-3">Date</th>
              <th className="p-3">Statut</th>
              <th className="p-3">Motif</th>
            </tr>
          </thead>
          <tbody>
            {filtrees.map((order) => (
              <tr key={order.id} className="border-b border-ink-900/5 last:border-0 hover:bg-beige-50">
                <td className="p-3"><a href={`/commandes/${order.id}`} className="font-medium">{order.numero_commande}</a></td>
                <td className="p-3">{order.client_nom}</td>
                <td className="p-3">{order.client_commune}</td>
                <td className="p-3">{formatDate(order.created_at)}</td>
                <td className="p-3"><StatutBadge statut={order.statut} /></td>
                <td className="p-3 text-xs text-ink-900/50">
                  {order.statut === "annulee" && order.motif_annulation}
                  {order.statut === "relance" && order.date_relance && `Relance le ${formatDate(order.date_relance)}`}
                </td>
              </tr>
            ))}
            {filtrees.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-ink-900/40">Aucune commande pour cette période.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
