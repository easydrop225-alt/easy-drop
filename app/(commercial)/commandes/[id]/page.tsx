import { createClient } from "@/lib/supabase/server";
import { OrderTimeline } from "@/components/commandes/order-timeline";
import { Card } from "@/components/ui/card";
import { formatFCFA, formatDate } from "@/lib/utils";
import { notFound } from "next/navigation";
import type { Order, OrderItem, Product } from "@/types/database";
import { MesInfosCommandeForm } from "./infos-form";
import { SuppressionBanner } from "./suppression-banner";

const STATUTS_MODIFIABLES = ["nouvelle"];

export default async function DetailCommandePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase.from("orders").select("*").eq("id", id).single();
  if (!order) notFound();

  const { data: items } = await supabase.from("order_items").select("*, products(*)").eq("order_id", id);
  const itemList = ((items ?? []) as (OrderItem & { products: Product })[]);
  const o = order as Order;

  const prixVente = itemList.reduce((a, i) => a + i.prix_vente_unitaire * i.quantite, 0);
  const prixFournisseur = itemList.reduce((a, i) => a + i.prix_fournisseur_unitaire * i.quantite, 0);
  const prixLivraison = o.frais_livraison;
  const prixTotal = prixVente + prixLivraison;
  const benefice = prixVente - prixFournisseur;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{o.numero_commande}</h1>
        <p className="text-sm text-ink-900/60">
          Créée le {formatDate(o.created_at)} à {new Date(o.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      {o.demande_suppression && <SuppressionBanner orderId={o.id} motif={o.demande_suppression_motif} />}

      <Card>
        <h2 className="mb-3 font-medium">Statut</h2>
        <OrderTimeline statut={o.statut} motif={o.motif_annulation} dateRelance={o.date_relance} />
        {o.date_livraison_prevue && (
          <p className="mt-2 text-xs text-ink-900/50">Livraison prévue le {formatDate(o.date_livraison_prevue)}</p>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 font-medium">Client</h2>
        {STATUTS_MODIFIABLES.includes(o.statut) ? (
          itemList[0] && <MesInfosCommandeForm order={o} item={itemList[0]} />
        ) : (
          <>
            <p>{o.client_nom} — {o.client_telephone}</p>
            <p className="text-sm text-ink-900/60">{o.client_adresse}, {o.client_commune}</p>
            <p className="mt-2 text-xs text-ink-900/40">
              Cette commande est déjà résolue : elle ne peut plus être modifiée. Contacte l'administration si besoin.
            </p>
          </>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 font-medium">Articles</h2>
        <ul className="space-y-2 text-sm">
          {itemList.map((item) => (
            <li key={item.id} className="border-b border-ink-900/5 pb-2 last:border-0">
              <div className="flex justify-between">
                <span>{item.products?.nom} × {item.quantite}</span>
                <span>{formatFCFA(item.prix_vente_unitaire * item.quantite)}</span>
              </div>
              {item.observation && (
                <p className="mt-1 text-xs text-ink-900/50">Observation : {item.observation}</p>
              )}
            </li>
          ))}
        </ul>
      </Card>

      {o.zone === "hors_abidjan" && (
        <Card>
          <h2 className="mb-3 font-medium">Expédition</h2>
          <p className="text-sm text-ink-900/60">
            Gare : {o.gare || "non précisée"} — Ville : {o.ville_expedition || "non précisée"}
          </p>
          {o.statut === "livree" && o.recu_expedition_url ? (
            <a
              href={o.recu_expedition_url}
              download
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block rounded-xl bg-terracotta-500 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-600"
            >
              Télécharger le reçu d'expédition
            </a>
          ) : (
            <p className="mt-2 text-xs text-ink-900/40">
              Le reçu d'expédition sera téléchargeable ici une fois la commande marquée comme livrée par l'administration.
            </p>
          )}
        </Card>
      )}

      <Card className="space-y-2 bg-beige-100">
        <div className="flex justify-between text-sm">
          <span className="text-ink-900/60">Prix de vente</span>
          <span>{formatFCFA(prixVente)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-ink-900/60">Prix de la livraison</span>
          <span>{formatFCFA(prixLivraison)}</span>
        </div>
        <div className="flex justify-between border-t border-ink-900/10 pt-2 font-medium">
          <span>Prix total</span>
          <span>{formatFCFA(prixTotal)}</span>
        </div>
        <div className="mt-3 border-t border-ink-900/10 pt-3">
          <p className="text-sm text-ink-900/60">Ton bénéfice sur cette commande</p>
          <p className="text-2xl font-semibold text-terracotta-600">{formatFCFA(benefice)}</p>
        </div>
      </Card>
    </div>
  );
}
