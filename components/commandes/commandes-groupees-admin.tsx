"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { StatutBadge } from "@/components/ui/badge";
import { StatutRapideSelect } from "./statut-rapide-select";
import { BarreActionGroupee } from "./barre-action-groupee";
import { cn, formatDate, formatFCFA } from "@/lib/utils";
import { exporterCSV } from "@/lib/export-csv";
import { Button } from "@/components/ui/button";
import { FiltreDate, correspondAuFiltre, type FiltreDateValeur } from "./filtre-date";
import type { Order, Profile, OrderItem, Product, ProductVariant } from "@/types/database";

export type OrderComplete = Order & {
  profiles: Pick<Profile, "nom" | "prenom" | "telephone" | "nom_boutique">;
  order_items: (OrderItem & { products: Product; product_variants: ProductVariant | null })[];
};

type BeneficeCommande = { total: number; paye: boolean };

/** Bénéfice de la commande + statut de paiement — le badge payé/non payé ne
 * s'affiche que pour les commandes livrées (avant, le paiement n'a pas de
 * sens ; annulée, le bénéfice est nul). Sert à vérifier d'un coup d'œil la
 * somme des paiements en attente d'un commercial (page Paiements). */
function ColonneBenefice({ order, benefice }: { order: OrderComplete; benefice?: BeneficeCommande }) {
  if (!benefice) return <span className="text-ink-900/30">—</span>;
  return (
    <div className="whitespace-nowrap">
      <p className="font-medium">{formatFCFA(benefice.total)}</p>
      {order.statut === "livree" && (
        <span
          className={cn(
            "mt-0.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium",
            benefice.paye ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
          )}
        >
          {benefice.paye ? "Payé" : "Non payé"}
        </span>
      )}
    </div>
  );
}

type Onglet = "nouvelles" | "annulees" | "livrees" | "relance" | "toutes";

function prixTotal(order: OrderComplete): number {
  return order.order_items.reduce((a, i) => a + i.prix_vente_unitaire * i.quantite, 0) + order.frais_livraison;
}

function labelVariante(item: OrderComplete["order_items"][number]): string {
  const v = item.product_variants;
  const variante = v ? [v.couleur, v.taille].filter(Boolean).join(" / ") : "";
  return variante ? `(${variante})` : "";
}

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

/** Colonne Date : date/heure d'enregistrement (discrète) + date prévue pour
 * la livraison (mise en avant) — la date de relance remplace la date
 * prévue quand la commande est "à relancer". */
function ColonneDate({ order }: { order: OrderComplete }) {
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

/** Statut + (pour "à relancer") la date juste à côté, et pour
 * annulée/livrée le motif juste en dessous — sans dupliquer le texte du badge. */
function ColonneStatut({ order }: { order: OrderComplete }) {
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

export function CommandesGroupeesAdmin({
  orders,
  imageParProduit,
  beneficeParCommande,
}: {
  orders: OrderComplete[];
  imageParProduit: Record<string, string | undefined>;
  beneficeParCommande: Record<string, BeneficeCommande>;
}) {
  const [filtre, setFiltre] = useState<FiltreDateValeur>({ annee: new Date().getFullYear(), mois: null, jour: null });
  const [groupeOuvert, setGroupeOuvert] = useState<Record<string, boolean>>({});
  const [ongletActif, setOngletActif] = useState<Onglet>("toutes");
  const [selection, setSelection] = useState<Set<string>>(new Set());

  function basculerSelection(orderId: string) {
    setSelection((s) => {
      const copie = new Set(s);
      if (copie.has(orderId)) copie.delete(orderId);
      else copie.add(orderId);
      return copie;
    });
  }

  const dates = useMemo(() => orders.map((o) => o.created_at), [orders]);
  const compteParStatut = useMemo(() => ({
    nouvelles: orders.filter((o) => o.statut === "confirmation").length,
    annulees: orders.filter((o) => o.statut === "annulee").length,
    livrees: orders.filter((o) => o.statut === "livree").length,
    relance: orders.filter((o) => o.statut === "relance").length,
  }), [orders]);

  const filtrees = useMemo(() => {
    const parDate = orders.filter((o) => correspondAuFiltre(o.created_at, filtre));
    switch (ongletActif) {
      case "nouvelles": return parDate.filter((o) => o.statut === "confirmation");
      case "annulees": return parDate.filter((o) => o.statut === "annulee");
      case "livrees": return parDate.filter((o) => o.statut === "livree");
      case "relance": return parDate.filter((o) => o.statut === "relance");
      default: return parDate;
    }
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

  const onglets: { valeur: Onglet; label: string; compte?: number }[] = [
    { valeur: "nouvelles", label: "🟡 Nouvelles", compte: compteParStatut.nouvelles },
    { valeur: "relance", label: "🟠 À relancer", compte: compteParStatut.relance },
    { valeur: "livrees", label: "🟢 Livrées", compte: compteParStatut.livrees },
    { valeur: "annulees", label: "🔴 Annulées", compte: compteParStatut.annulees },
    { valeur: "toutes", label: "Toutes les commandes" },
  ];

  function exporter() {
    const lignes = filtrees.map((o) => [
      o.numero_commande,
      formatDate(o.created_at),
      `${o.profiles?.prenom ?? ""} ${o.profiles?.nom ?? ""}`.trim(),
      o.profiles?.nom_boutique ?? "",
      o.client_nom,
      o.client_telephone,
      o.client_adresse,
      o.client_commune,
      o.order_items.map((i) => `${i.quantite}x ${i.products?.nom ?? ""}`).join(", "),
      prixTotal(o),
      o.statut,
    ]);
    exporterCSV("easydrop-commandes", [
      "Référence", "Date", "Commercial", "Boutique", "Client", "Téléphone client",
      "Adresse", "Commune", "Articles", "Prix total", "Statut",
    ], lignes);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {onglets.map((o) => (
            <button
              key={o.valeur}
              onClick={() => setOngletActif(o.valeur)}
              className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${ongletActif === o.valeur ? "bg-terracotta-500 text-white" : "bg-surface text-ink-900/60 hover:bg-beige-100"}`}
            >
              {o.label} {!!o.compte && o.compte > 0 && `(${o.compte})`}
            </button>
          ))}
        </div>
        <Button size="sm" variant="secondary" onClick={exporter}>
          📊 Exporter CSV
        </Button>
      </div>

      <FiltreDate dates={dates} valeur={filtre} onChange={setFiltre} />

      {selection.size > 0 && (
        <BarreActionGroupee
          orderIds={Array.from(selection)}
          onTermine={() => setSelection(new Set())}
        />
      )}

      {filtrees.length > 0 && (
        <label className="flex items-center gap-2 text-xs text-ink-900/50">
          <input
            type="checkbox"
            checked={filtrees.every((o) => selection.has(o.id))}
            onChange={(e) => {
              setSelection(e.target.checked ? new Set(filtrees.map((o) => o.id)) : new Set());
            }}
          />
          Tout sélectionner ({filtrees.length} commande{filtrees.length > 1 ? "s" : ""} affichée{filtrees.length > 1 ? "s" : ""})
        </label>
      )}

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
                {groupe.nomBoutique && <span className="ml-2 rounded-full bg-surface px-2 py-0.5 text-xs font-normal text-ink-900/60">🏪 {groupe.nomBoutique}</span>}
              </span>
              <span className="text-sm text-ink-900/50">{groupe.commandes.length} commande(s) {ouvert ? "▲" : "▼"}</span>
            </button>

            {ouvert && (
              <>
                {/* Vue mobile : carte complète — de quoi préparer le colis sans ouvrir le détail. */}
                <div className="space-y-2 md:hidden">
                  {groupe.commandes.map((order) => (
                    <Card key={order.id} className="space-y-2 p-3">
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={selection.has(order.id)}
                          onChange={() => basculerSelection(order.id)}
                          className="mt-1 shrink-0"
                          aria-label={`Sélectionner la commande ${order.numero_commande}`}
                        />
                        <Link href={`/admin/commandes/${order.id}`} prefetch className="block flex-1 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">{order.numero_commande}</span>
                          <span className="text-sm font-medium text-ink-900/70">{formatFCFA(prixTotal(order))}</span>
                        </div>
                        <p className="text-xs text-ink-900/70">{order.client_nom} · {order.client_telephone}</p>
                        <p className="text-xs text-ink-900/50">{order.client_adresse}, {order.client_commune}</p>
                        <div className="text-xs text-ink-900/70">
                          <RecapitulatifArticles order={order} />
                        </div>
                        <ColonneDate order={order} />
                      </Link>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <StatutRapideSelect orderId={order.id} statutActuel={order.statut} />
                        <ColonneBenefice order={order} benefice={beneficeParCommande[order.id]} />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          href={`/admin/commandes/${order.id}/bon`}
                          target="_blank"
                          onClick={(e) => e.stopPropagation()}
                          className="shrink-0 rounded-lg border border-ink-900/10 px-2 py-1 text-xs hover:bg-beige-100"
                        >
                          🖨️ Bon
                        </Link>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Vue bureau : tableau — client (nom + contact), articles détaillés
                    (produit + variante + quantité), adresse complète, prix total
                    (livraison incluse), dates, statut modifiable directement, impression. */}
                <Card className="hidden p-0 md:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-ink-900/5 text-left text-ink-900/50">
                        <th className="p-2"></th>
                        <th className="p-2">Référence</th>
                        <th className="p-2">Client</th>
                        <th className="p-2">Articles</th>
                        <th className="p-2">Adresse</th>
                        <th className="p-2">Prix total</th>
                        <th className="p-2">Date</th>
                        <th className="p-2">Statut</th>
                        <th className="p-2">Bénéfice</th>
                        <th className="p-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupe.commandes.map((order) => {
                        const premierArticle = order.order_items[0];
                        const image = premierArticle ? imageParProduit[premierArticle.product_id] : undefined;
                        return (
                          <tr key={order.id} className="border-b border-ink-900/5 last:border-0 hover:bg-beige-50">
                            <td className="p-2">
                              <input
                                type="checkbox"
                                checked={selection.has(order.id)}
                                onChange={() => basculerSelection(order.id)}
                                aria-label={`Sélectionner la commande ${order.numero_commande}`}
                              />
                            </td>
                            <td className="p-2">
                              <Link href={`/admin/commandes/${order.id}`} prefetch className="font-medium">{order.numero_commande}</Link>
                            </td>
                            <td className="p-2">
                              <p>{order.client_nom}</p>
                              <p className="text-xs text-ink-900/50">{order.client_telephone}</p>
                            </td>
                            <td className="p-2">
                              <div className="flex items-start gap-2">
                                <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-beige-100">
                                  {image ? (
                                    <Image src={image} alt="" fill sizes="32px" className="object-cover" />
                                  ) : null}
                                </div>
                                <div className="text-xs">
                                  <RecapitulatifArticles order={order} />
                                </div>
                              </div>
                            </td>
                            <td className="p-2 max-w-[200px] text-xs">
                              {order.client_adresse}, {order.client_commune}
                              {order.zone === "hors_abidjan" && order.ville_expedition && (
                                <p className="text-ink-900/40">Expédition → {order.ville_expedition} ({order.gare ?? "gare non précisée"})</p>
                              )}
                            </td>
                            <td className="p-2 whitespace-nowrap font-medium">{formatFCFA(prixTotal(order))}</td>
                            <td className="p-2"><ColonneDate order={order} /></td>
                            <td className="p-2">
                              <ColonneStatut order={order} />
                              <div className="mt-1"><StatutRapideSelect orderId={order.id} statutActuel={order.statut} /></div>
                            </td>
                            <td className="p-2">
                              <ColonneBenefice order={order} benefice={beneficeParCommande[order.id]} />
                            </td>
                            <td className="p-2">
                              <Link
                                href={`/admin/commandes/${order.id}/bon`}
                                target="_blank"
                                className="whitespace-nowrap rounded-lg border border-ink-900/10 px-2 py-1 text-xs hover:bg-beige-100"
                              >
                                🖨️ Bon
                              </Link>
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
