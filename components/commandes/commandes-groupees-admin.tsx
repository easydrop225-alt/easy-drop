"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { StatutBadge } from "@/components/ui/badge";
import { StatutRapideSelect } from "./statut-rapide-select";
import { formatDate, formatFCFA } from "@/lib/utils";
import { FiltreDate, correspondAuFiltre, type FiltreDateValeur } from "./filtre-date";
import type { Order, Profile, OrderItem, Product, ProductVariant } from "@/types/database";

export type OrderComplete = Order & {
  profiles: Pick<Profile, "nom" | "prenom" | "telephone" | "nom_boutique">;
  order_items: (OrderItem & { products: Product; product_variants: ProductVariant | null })[];
};

function prixTotal(order: OrderComplete): number {
  return order.order_items.reduce((a, i) => a + i.prix_vente_unitaire * i.quantite, 0) + order.frais_livraison;
}

function labelVariante(item: OrderComplete["order_items"][number]): string {
  const v = item.product_variants;
  const variante = v ? [v.couleur, v.taille].filter(Boolean).join(" / ") : "";
  return variante ? `(${variante})` : "";
}

/** Récapitulatif complet des articles — pensé pour préparer le colis sans
 * avoir besoin d'ouvrir le détail de la commande : produit, variante et
 * quantité pour CHAQUE ligne (une commande peut contenir plusieurs
 * variantes différentes). */
function RecapitulatifArticles({ order }: { order: OrderComplete }) {
  return (
    <ul className="space-y-0.5">
      {order.order_items.map((item) => (
        <li key={item.id}>
          <span className="font-medium">{item.quantite}×</span> {item.products?.nom ?? "—"} {labelVariante(item)}
          {item.observation && <span className="italic text-ink-900/40"> — {item.observation}</span>}
        </li>
      ))}
    </ul>
  );
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
  const [ongletActif, setOngletActif] = useState<"nouvelles" | "toutes">("toutes");

  const dates = useMemo(() => orders.map((o) => o.created_at), [orders]);
  const nombreNouvelles = useMemo(() => orders.filter((o) => o.statut === "confirmation").length, [orders]);

  const filtrees = useMemo(() => {
    const parDate = orders.filter((o) => correspondAuFiltre(o.created_at, filtre));
    return ongletActif === "nouvelles" ? parDate.filter((o) => o.statut === "confirmation") : parDate;
  }, [orders, filtre, ongletActif]);

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
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setOngletActif("nouvelles")}
          className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${ongletActif === "nouvelles" ? "bg-terracotta-500 text-white" : "bg-white text-ink-900/60 hover:bg-beige-100"}`}
        >
          🟡 Nouvelles commandes {nombreNouvelles > 0 && `(${nombreNouvelles})`}
        </button>
        <button
          onClick={() => setOngletActif("toutes")}
          className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${ongletActif === "toutes" ? "bg-terracotta-500 text-white" : "bg-white text-ink-900/60 hover:bg-beige-100"}`}
        >
          Toutes les commandes
        </button>
      </div>

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
                {/* Vue mobile : carte complète — de quoi préparer le colis sans ouvrir le détail. */}
                <div className="space-y-2 md:hidden">
                  {groupe.commandes.map((order) => (
                    <Card key={order.id} className="space-y-2 p-3">
                      <Link href={`/admin/commandes/${order.id}`} prefetch className="block space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">{order.numero_commande}</span>
                          <span className="text-sm font-medium text-ink-900/70">{formatFCFA(prixTotal(order))}</span>
                        </div>
                        <p className="text-xs text-ink-900/70">{order.client_nom} · {order.client_telephone}</p>
                        <p className="text-xs text-ink-900/50">{order.client_adresse}, {order.client_commune}</p>
                        <div className="text-xs text-ink-900/70">
                          <RecapitulatifArticles order={order} />
                        </div>
                        <p className="text-[11px] text-ink-900/40">{formatDate(order.created_at)}</p>
                      </Link>
                      <StatutRapideSelect orderId={order.id} statutActuel={order.statut} />
                    </Card>
                  ))}
                </div>

                {/* Vue bureau : tableau — client (nom + contact), articles détaillés (produit + variante + quantité), adresse complète, prix total (livraison incluse), statut modifiable directement. */}
                <Card className="hidden p-0 md:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-ink-900/5 text-left text-ink-900/50">
                        <th className="p-2">Référence</th>
                        <th className="p-2">Client</th>
                        <th className="p-2">Articles</th>
                        <th className="p-2">Adresse</th>
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
                              <p>{order.client_nom}</p>
                              <p className="text-xs text-ink-900/50">{order.client_telephone}</p>
                            </td>
                            <td className="p-2">
                              <div className="flex items-start gap-2">
                                <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-beige-100">
                                  {image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                                  ) : null}
                                </div>
                                <div className="text-xs">
                                  <RecapitulatifArticles order={order} />
                                </div>
                              </div>
                            </td>
                            <td className="p-2 max-w-[220px] text-xs">
                              {order.client_adresse}, {order.client_commune}
                              {order.zone === "hors_abidjan" && order.ville_expedition && (
                                <p className="text-ink-900/40">Expédition → {order.ville_expedition} ({order.gare ?? "gare non précisée"})</p>
                              )}
                            </td>
                            <td className="p-2 whitespace-nowrap font-medium">{formatFCFA(prixTotal(order))}</td>
                            <td className="p-2 whitespace-nowrap">{formatDate(order.created_at)}</td>
                            <td className="p-2">
                              <div className="mb-1"><StatutBadge statut={order.statut} /></div>
                              <StatutRapideSelect orderId={order.id} statutActuel={order.statut} />
                            </td>
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
