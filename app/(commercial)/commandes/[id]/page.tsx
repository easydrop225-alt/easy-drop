import { createClient } from "@/lib/supabase/server";
import { OrderTimeline } from "@/components/commandes/order-timeline";
import { Card } from "@/components/ui/card";
import { formatFCFA, formatDate } from "@/lib/utils";
import { notFound } from "next/navigation";
import type { Order, OrderItem, Product } from "@/types/database";
import { MesInfosCommandeForm } from "./infos-form";

const STATUTS_MODIFIABLES = ["nouvelle", "en_attente", "confirmee", "en_preparation"];

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

  const prixVente = itemList.reduce((a, i) => a + i.prix_vente_unitaire * i.quantite, 0);
  const prixFournisseur = itemList.reduce((a, i) => a + i.prix_fournisseur_unitaire * i.quantite, 0);
  const prixLivraison = (order as Order).frais_livraison;
  const prixTotal = prixVente + prixLivraison;
  const benefice = prixVente - prixFournisseur;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{(order as Order).numero_commande}</h1>
        <p className="text-sm text-ink-900/60">Créée le {formatDate((order as Order).created_at)}</p>
      </div>

      <Card>
        <h2 className="mb-3 font-medium">Statut</h2>
        <OrderTimeline statut={(order as Order).statut} />
      </Card>

      <Card>
        <h2 className="mb-3 font-medium">Client</h2>
        {STATUTS_MODIFIABLES.includes((order as Order).statut) ? (
          itemList[0] && <MesInfosCommandeForm order={order as Order} item={itemList[0]} />
        ) : (
          <>
            <p>{(order as Order).client_nom} — {(order as Order).client_telephone}</p>
            <p className="text-sm text-ink-900/60">{(order as Order).client_adresse}, {(order as Order).client_commune}</p>
            <p className="mt-2 text-xs text-ink-900/40">
              Cette commande est déjà en cours de livraison ou au-delà : elle ne peut plus être modifiée. Contacte l'administration si besoin.
            </p>
          </>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 font-medium">Articles</h2>
        <ul className="space-y-2 text-sm">
          {itemList.map((item) => (
            <li key={item.id} className="flex justify-between border-b border-ink-900/5 pb-2 last:border-0">
              <span>{item.products?.nom} × {item.quantite}</span>
              <span>{formatFCFA(item.prix_vente_unitaire * item.quantite)}</span>
            </li>
          ))}
        </ul>
      </Card>

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
