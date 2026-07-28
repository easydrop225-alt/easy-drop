"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { StatutBadge } from "@/components/ui/badge";
import { formatDate, formatFCFA } from "@/lib/utils";
import { FiltreDate, correspondAuFiltre, type FiltreDateValeur } from "./filtre-date";
import type { Order, Profile, OrderItem, Product } from "@/types/database";

export type OrderComplete = Order & {
  profiles: Pick<Profile, "nom" | "prenom" | "telephone" | "nom_boutique">;
  order_items: (OrderItem & { products: Product })[];
};

function prixTotal(order: OrderComplete): number {
  return order.order_items.reduce((a, i) => a + i.prix_vente_unitaire * i.quantite, 0) + order.frais_livraison;
}

export function CommandesGroupeesAdmin({
  orders,
  imageParProduit,
}: {
  orders: OrderComplete[];
  imageParProduit: Record<string, string | undefined>;
}) {
  const [filtre, setFiltre] = useState<FiltreDateValeur>({ annee: new Date().getFullYear(), mois: null, jour: null });
  const [groupeOuvert, setGroupeOuvert] = useState<Record<string, boolean>>({});

  const dates = useMemo(() => orders.map((o) => o.created_at), [orders]);
  const filtrees = useMemo(() => orders.filter((o) => correspondAuFiltre(o.created_at, filtre)), [orders, filtre]);

  const groupes = useMemo(() => {
    const map = new Map<string, { nom: string; telephone: string; nomBoutique: string | null; commandes: OrderComplete[] }>();
    for (const o of filtrees) {
      const cle = o.commercial_id;
      const nom = `${o.profiles?.prenom ?? "?"} ${o.profiles?.nom ?? ""}`.trim();
      if (!map.has(cle)) map.set(cle, { nom, telephone: o.profiles?.telephone ?? "", nomBoutique: o.profiles?.nom_boutique ?? null, commandes: [] });
      map.get(cle)!.commandes.push(o);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].commandes.length - a[1].commandes.length);
  }, [filtrees]);

  return (
    <div className="space-y-4">
      <FiltreDate dates={dates} valeur={filtre} onChange={setFiltre} />

      {groupes.length === 0 && <p className="text-ink-900/60">Aucune commande pour cette période.</p>}

      {groupes.map(([commercialId, groupe]) => {
        const ouvert = groupeOuvert[commercialId] ?? true;
        return (
          <div key={commercialId}>
            <button
              onClick={() => setGroupeOuvert((s) => ({ ...s, [commercialId]: !ouvert }))}
              className="mb-2 flex w-full items-center justify-between rounded-xl bg-beige-100 px-4 py-2 text-left"
            >
              <span className="font-medium">
                {groupe.nom} <span className="font-normal text-ink-900/50">— {groupe.telephone}</span>
                {groupe.nomBoutique && <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs font-normal text-ink-900/60">🏪 {groupe.nomBoutique}</span>}
              </span>
              <span className="text-sm text-ink-900/50">{groupe.commandes.length} commande(s) {ouvert ? "▲" : "▼"}</span>
            </button>

            {ouvert && (
              <>
                {/* Vue mobile : carte compacte */}
                <div className="space-y-2 md:hidden">
                  {groupe.commandes.map((order) => (
                    <Link key={order.id} href={`/admin/commandes/${order.id}`} prefetch>
                      <Card className="space-y-1 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">{order.numero_commande}</span>
                          <StatutBadge statut={order.statut} />
                        </div>
                        <p className="text-xs text-ink-900/60">{order.order_items[0]?.products?.nom ?? "—"} · {order.client_nom}</p>
                        <div className="flex items-center justify-between text-[11px] text-ink-900/40">
                          <span>{formatDate(order.created_at)}</span>
                          <span className="font-medium text-ink-900/60">{formatFCFA(prixTotal(order))}</span>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>

                {/* Vue bureau : tableau compact, statut sur la même ligne que le reste. */}
                <Card className="hidden p-0 md:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-ink-900/5 text-left text-ink-900/50">
                        <th className="p-2">Référence</th>
                        <th className="p-2">Produit</th>
                        <th className="p-2">Client</th>
                        <th className="p-2">Prix total</th>
                        <th className="p-2">Date</th>
                        <th className="p-2">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupe.commandes.map((order) => {
                        const premierArticle = order.order_items[0];
                        const image = premierArticle ? imageParProduit[premierArticle.product_id] : undefined;
                        return (
                          <tr key={order.id} className="border-b border-ink-900/5 last:border-0 hover:bg-beige-50">
                            <td className="p-2">
                              <Link href={`/admin/commandes/${order.id}`} prefetch className="font-medium">{order.numero_commande}</Link>
                            </td>
                            <td className="p-2">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-beige-100">
                                  {image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                                  ) : null}
                                </div>
                                <span className="truncate">{premierArticle?.products?.nom ?? "—"}</span>
                              </div>
                            </td>
                            <td className="p-2">
                              <p>{order.client_nom}</p>
                              <p className="max-w-[180px] truncate text-xs text-ink-900/50">{order.client_commune} — {order.client_adresse}</p>
                            </td>
                            <td className="p-2 whitespace-nowrap font-medium">{formatFCFA(prixTotal(order))}</td>
                            <td className="p-2 whitespace-nowrap">{formatDate(order.created_at)}</td>
                            <td className="p-2"><StatutBadge statut={order.statut} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </Card>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
