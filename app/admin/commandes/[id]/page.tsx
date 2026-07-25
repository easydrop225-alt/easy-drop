import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { StatutBadge } from "@/components/ui/badge";
import { formatFCFA, formatDate } from "@/lib/utils";
import type { Order, OrderItem, Product, Profile } from "@/types/database";
import { StatutForm } from "./statut-form";
import { LivraisonForm } from "./livraison-form";
import { InfosCommandeForm } from "./infos-form";
import { RecuExpeditionUploader } from "@/components/commandes/recu-expedition-uploader";

export default async function DetailCommandeAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase.from("orders").select("*, profiles(nom, prenom, telephone)").eq("id", id).single();
  if (!order) notFound();

  const { data: items } = await supabase.from("order_items").select("*, products(*)").eq("order_id", id);
  const itemList = ((items ?? []) as (OrderItem & { products: Product })[]);
  const o = order as Order & { profiles: Pick<Profile, "nom" | "prenom" | "telephone"> };

  const prixVente = itemList.reduce((a, i) => a + i.prix_vente_unitaire * i.quantite, 0);
  const prixFournisseur = itemList.reduce((a, i) => a + i.prix_fournisseur_unitaire * i.quantite, 0);
  const prixTotal = prixVente + o.frais_livraison;
  const benefice = prixVente - prixFournisseur;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{o.numero_commande}</h1>
          <p className="text-sm text-ink-900/60">Créée le {formatDate(o.created_at)} par {o.profiles?.prenom} {o.profiles?.nom}</p>
        </div>
        <StatutBadge statut={o.statut} />
      </div>

      <Card>
        <h2 className="mb-3 font-medium">Changer le statut</h2>
        <StatutForm orderId={o.id} statutActuel={o.statut} />
      </Card>

      <Card>
        <h2 className="mb-3 font-medium">Informations de la commande (modifiables)</h2>
        {itemList[0] && <InfosCommandeForm order={o} item={itemList[0]} />}
      </Card>

      <Card>
        <h2 className="mb-3 font-medium">Prix de la livraison</h2>
        <LivraisonForm orderId={o.id} fraisActuel={o.frais_livraison} />
      </Card>

      {o.zone === "hors_abidjan" && (
        <Card>
          <h2 className="mb-3 font-medium">Expédition</h2>
          <p className="mb-3 text-sm text-ink-900/60">
            Gare : {o.gare || "non précisée"} — Ville de destination : {o.ville_expedition || "non précisée"}
          </p>
          <RecuExpeditionUploader orderId={o.id} recuActuel={o.recu_expedition_url} />
        </Card>
      )}

      <Card className="space-y-2 bg-beige-100">
        <div className="flex justify-between text-sm">
          <span className="text-ink-900/60">Prix de vente</span>
          <span>{formatFCFA(prixVente)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-ink-900/60">Prix de la livraison</span>
          <span>{formatFCFA(o.frais_livraison)}</span>
        </div>
        <div className="flex justify-between border-t border-ink-900/10 pt-2 font-medium">
          <span>Prix total (client)</span>
          <span>{formatFCFA(prixTotal)}</span>
        </div>
        <div className="mt-3 border-t border-ink-900/10 pt-3">
          <p className="text-sm text-ink-900/60">Bénéfice du commercial (non affecté par la livraison)</p>
          <p className="text-2xl font-semibold text-terracotta-600">{formatFCFA(benefice)}</p>
        </div>
      </Card>
    </div>
  );
}
