import { createClient } from "@/lib/supabase/server";
import { OrderTimeline } from "@/components/commandes/order-timeline";
import { Card } from "@/components/ui/card";
import { formatFCFA, formatDate } from "@/lib/utils";
import { notFound } from "next/navigation";
import { libelleArticle } from "@/lib/produits/libelle-variante";
import type { Order, OrderItem, Product, ProductVariant } from "@/types/database";
import { MesInfosCommandeForm } from "./infos-form";
import { SuppressionBanner } from "./suppression-banner";
import { AnnulerCommandeBouton } from "./annuler-bouton";
import { PrixCommandeForm } from "@/components/commandes/prix-commande-form";

const STATUTS_MODIFIABLES = ["confirmation", "traitement"];
const STATUTS_ANNULABLES = ["confirmation", "traitement", "relance"];
const DELAI_ANNULATION_HEURES = 24;

export default async function DetailCommandePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: order }, { data: items }] = await Promise.all([
    supabase.from("orders").select("*").eq("id", id).single(),
    supabase.from("order_items").select("*, products(*), product_variants(*)").eq("order_id", id),
  ]);
  if (!order) notFound();

  const itemList = ((items ?? []) as (OrderItem & { products: Product; product_variants: ProductVariant | null })[]);
  const o = order as Order;

  const prixVente = itemList.reduce((a, i) => a + i.prix_vente_unitaire * i.quantite, 0);
  const prixFournisseur = itemList.reduce((a, i) => a + i.prix_fournisseur_unitaire * i.quantite, 0);
  const prixLivraison = o.frais_livraison;
  const prixTotal = prixVente + prixLivraison;
  const benefice = prixVente - prixFournisseur;

  const heuresEcoulees = (Date.now() - new Date(o.created_at).getTime()) / (1000 * 60 * 60);
  const peutAnnuler = STATUTS_ANNULABLES.includes(o.statut) && heuresEcoulees <= DELAI_ANNULATION_HEURES;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{o.numero_commande}</h1>
        <p className="text-sm text-ink-900/60">
          Créée le {formatDate(o.created_at)} à {new Date(o.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      {o.demande_suppression && <SuppressionBanner orderId={o.id} motif={o.demande_suppression_motif} />}

      {o.statut === "relance" && (
        <Card className="border-amber-300 bg-amber-50">
          <p className="font-medium text-amber-900">🟠 Appelle ton client</p>
          <p className="mt-1 text-sm text-amber-900/80">
            La livraison n&apos;a pas pu se faire{o.motif_annulation ? ` (${o.motif_annulation})` : ""}. Appelle {o.client_nom} pour confirmer
            {o.date_relance ? ` la nouvelle livraison du ${formatDate(o.date_relance)}` : " une nouvelle date de livraison"} et le motiver à recevoir son colis.
            Après 2 relances sans livraison, la commande est annulée.
          </p>
          <div className="mt-3">
            <a href={`tel:${o.client_telephone}`} className="inline-block rounded-full bg-amber-600 px-4 py-2 text-sm font-medium text-white">
              📞 Appeler {o.client_telephone}
            </a>
          </div>
        </Card>
      )}

      <Card>
        <h2 className="mb-3 font-medium">Statut</h2>
        <OrderTimeline statut={o.statut} motif={o.motif_annulation} dateRelance={o.date_relance} />
        {o.date_livraison_prevue && (
          <p className="mt-2 text-xs text-ink-900/50">Livraison prévue le {formatDate(o.date_livraison_prevue)}</p>
        )}
        {peutAnnuler && (
          <div className="mt-4 border-t border-ink-900/5 pt-3">
            <AnnulerCommandeBouton orderId={o.id} />
          </div>
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
                <span>{libelleArticle(item.products?.nom, item.product_variants)} × {item.quantite}</span>
                <span>{formatFCFA(item.prix_vente_unitaire * item.quantite)}</span>
              </div>
              {item.observation && (
                <p className="mt-1 text-xs text-ink-900/50">Observation : {item.observation}</p>
              )}
            </li>
          ))}
        </ul>
      </Card>

      {STATUTS_MODIFIABLES.includes(o.statut) && (
        <Card>
          <h2 className="mb-1 font-medium">Modifier le prix</h2>
          <p className="mb-3 text-xs text-ink-900/50">
            Possible tant que la commande n&apos;est pas en cours de livraison. Le prix de la livraison est fixé par l&apos;administration.
          </p>
          <PrixCommandeForm
            key={itemList.map((i) => `${i.id}:${i.prix_vente_unitaire}`).join("|")}
            orderId={o.id}
            mode="commercial"
            fraisLivraison={o.frais_livraison}
            lignes={itemList.map((i) => ({
              id: i.id,
              libelle: libelleArticle(i.products?.nom, i.product_variants),
              quantite: i.quantite,
              prixVenteUnitaire: Number(i.prix_vente_unitaire),
              prixFournisseurUnitaire: Number(i.prix_fournisseur_unitaire),
            }))}
          />
        </Card>
      )}

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
