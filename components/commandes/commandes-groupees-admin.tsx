"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { StatutBadge } from "@/components/ui/badge";
import { formatDate, formatFCFA } from "@/lib/utils";
import { FiltreDate, correspondAuFiltre, type FiltreDateValeur } from "./filtre-date";
import type { Order, Profile, OrderItem, Product } from "@/types/database";

export type OrderComplete = Order & {
  profiles: Pick<Profile, "nom" | "prenom" | "telephone" | "nom_boutique">;
  order_items: (OrderItem & { products: Product })[];
};

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
              <div className="space-y-3">
                {groupe.commandes.map((order) => {
                  const premierArticle = order.order_items[0];
                  const image = premierArticle ? imageParProduit[premierArticle.product_id] : undefined;

                  return (
                    <a key={order.id} href={`/admin/commandes/${order.id}`}>
                      <Card className="flex flex-col gap-4 transition hover:shadow-md sm:flex-row sm:items-center">
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-beige-100">
                          {image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-ink-900/30">Photo</div>
                          )}
                        </div>

                        <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
                          <div>
                            <p className="text-ink-900/50">Référence</p>
                            <p className="font-medium">{order.numero_commande}</p>
                          </div>
                          <div>
                            <p className="text-ink-900/50">Produit</p>
                            <p>{premierArticle?.products?.nom ?? "—"}</p>
                            {premierArticle?.observation && (
                              <p className="text-xs italic text-ink-900/40">{premierArticle.observation}</p>
                            )}
                          </div>
                          <div>
                            <p className="text-ink-900/50">Client</p>
                            <p>{order.client_nom}</p>
                            <p className="text-xs text-ink-900/40">{order.client_telephone}</p>
                          </div>
                          <div className="col-span-2 sm:col-span-2">
                            <p className="text-ink-900/50">Adresse de livraison</p>
                            <p>{order.client_adresse}, {order.client_commune}</p>
                            {order.zone === "hors_abidjan" && order.ville_expedition && (
                              <p className="text-xs text-ink-900/40">Expédition → {order.ville_expedition} ({order.gare ?? "gare non précisée"})</p>
                            )}
                          </div>
                          <div>
                            <p className="text-ink-900/50">Date</p>
                            <p>{formatDate(order.created_at)} à {new Date(order.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
                          </div>
                          <div>
                            <p className="text-ink-900/50">Prix total</p>
                            <p className="font-medium">
                              {formatFCFA(order.order_items.reduce((a, i) => a + i.prix_vente_unitaire * i.quantite, 0) + order.frais_livraison)}
                            </p>
                          </div>
                          <div>
                            <p className="text-ink-900/50">Statut</p>
                            <StatutBadge statut={order.statut} />
                          </div>
                        </div>
                      </Card>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
