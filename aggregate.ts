"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StatutBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { FiltreDate, correspondAuFiltre, type FiltreDateValeur } from "./filtre-date";
import type { Order } from "@/types/database";

/** Statut + (pour "à relancer") la date juste à côté du badge, et pour
 * annulée/livrée le motif juste en dessous — sans dupliquer le texte du badge. */
function ColonneStatut({ order }: { order: Order }) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5">
        <StatutBadge statut={order.statut} />
        {order.statut === "relance" && order.date_relance && (
          <span className="text-xs font-medium text-orange-700">{formatDate(order.date_relance)}</span>
        )}
      </div>
      {(order.statut === "annulee" || order.statut === "livree") && order.motif_annulation && (
        <p className="mt-0.5 text-xs text-ink-900/40">{order.motif_annulation}</p>
      )}
    </div>
  );
}

/** Date d'enregistrement (discrète, italique) + date prévue de livraison
 * (mise en avant) dans la même cellule — la date de relance remplace la
 * date prévue quand la commande est "à relancer". */
function ColonneDate({ order }: { order: Order }) {
  const dateAMettreEnAvant = order.statut === "relance" && order.date_relance ? order.date_relance : order.date_livraison_prevue;
  return (
    <div className="whitespace-nowrap">
      <p className="text-[11px] italic text-ink-900/40">
        {formatDate(order.created_at)} · {new Date(order.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
      </p>
      {dateAMettreEnAvant && <p className="text-xs font-semibold">{formatDate(dateAMettreEnAvant)}</p>}
    </div>
  );
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
              <ColonneDate order={order} />
            </Card>
          </Link>
        ))}
        {filtrees.length === 0 && (
          <Card><p className="p-3 text-center text-sm text-ink-900/40">Aucune commande pour cette période.</p></Card>
        )}
      </div>

      {/* Vue bureau : tableau compact — 4 colonnes, statut et motif regroupés
          dans la même cellule (pas de colonne séparée qui casse la mise en page). */}
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
                <td className="p-2"><ColonneDate order={order} /></td>
                <td className="p-2"><ColonneStatut order={order} /></td>
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
