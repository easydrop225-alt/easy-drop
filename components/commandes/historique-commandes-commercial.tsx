"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StatutBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { FiltreDate, correspondAuFiltre, type FiltreDateValeur } from "./filtre-date";
import type { Order } from "@/types/database";

function MotifTexte({ order }: { order: Order }) {
  if (order.statut === "annulee" || order.statut === "livree") {
    return order.motif_annulation ? <>{order.motif_annulation}</> : null;
  }
  if (order.statut === "relance") {
    return (
      <>
        {order.date_relance && `À relancer le ${formatDate(order.date_relance)}`}
        {order.motif_annulation && ` — ${order.motif_annulation}`}
      </>
    );
  }
  return null;
}

export function HistoriqueCommandesCommercial({ orders }: { orders: Order[] }) {
  const [filtre, setFiltre] = useState<FiltreDateValeur>({ annee: new Date().getFullYear(), mois: null, jour: null });

  const dates = useMemo(() => orders.map((o) => o.created_at), [orders]);
  const filtrees = useMemo(() => orders.filter((o) => correspondAuFiltre(o.created_at, filtre)), [orders, filtre]);

  return (
    <div className="space-y-4">
      <FiltreDate dates={dates} valeur={filtre} onChange={setFiltre} />

      {/* Vue mobile : une carte compacte par commande. */}
      <div className="space-y-2 md:hidden">
        {filtrees.map((order) => (
          <Link key={order.id} href={`/commandes/${order.id}`} prefetch>
            <Card className="space-y-1 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{order.numero_commande}</span>
                <StatutBadge statut={order.statut} />
              </div>
              <p className="text-xs text-ink-900/60">{order.client_nom} · {order.client_commune}</p>
              <p className="text-[11px] text-ink-900/40">{formatDate(order.created_at)}</p>
            </Card>
          </Link>
        ))}
        {filtrees.length === 0 && (
          <Card><p className="p-3 text-center text-sm text-ink-900/40">Aucune commande pour cette période.</p></Card>
        )}
      </div>

      {/* Vue bureau : tableau compact — 4 colonnes seulement. */}
      <Card className="hidden p-0 md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-900/5 text-left text-ink-900/50">
              <th className="p-2">Numéro</th>
              <th className="p-2">Client</th>
              <th className="p-2">Date</th>
              <th className="p-2">Statut</th>
            </tr>
          </thead>
          <tbody>
            {filtrees.map((order) => (
              <tr key={order.id} className="border-b border-ink-900/5 last:border-0 hover:bg-beige-50">
                <td className="p-2">
                  <Link href={`/commandes/${order.id}`} prefetch className="font-medium">{order.numero_commande}</Link>
                </td>
                <td className="p-2">
                  <p>{order.client_nom}</p>
                  <p className="text-xs text-ink-900/50">{order.client_commune} — {order.client_adresse}</p>
                </td>
                <td className="p-2 whitespace-nowrap">{formatDate(order.created_at)}</td>
                <td className="p-2">
                  <StatutBadge statut={order.statut} />
                  <p className="mt-0.5 text-xs text-ink-900/40"><MotifTexte order={order} /></p>
                </td>
              </tr>
            ))}
            {filtrees.length === 0 && (
              <tr><td colSpan={4} className="p-6 text-center text-ink-900/40">Aucune commande pour cette période.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
