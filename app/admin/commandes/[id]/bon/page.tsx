import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { formatFCFA, formatDate } from "@/lib/utils";
import { ImprimerBouton } from "./imprimer-bouton";
import { ShoppingBag } from "lucide-react";
import type { Order, OrderItem, Product, ProductVariant, Profile } from "@/types/database";

export default async function BonDeCommandePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*, profiles(nom, prenom, telephone, nom_boutique), order_items(*, products(*), product_variants(*))")
    .eq("id", id)
    .single();

  if (!order) notFound();

  const o = order as Order & {
    profiles: Pick<Profile, "nom" | "prenom" | "telephone" | "nom_boutique">;
    order_items: (OrderItem & { products: Product; product_variants: ProductVariant | null })[];
  };

  const prixTotal = o.order_items.reduce((a, i) => a + i.prix_vente_unitaire * i.quantite, 0) + o.frais_livraison;
  const dateLivraison = o.statut === "relance" && o.date_relance ? o.date_relance : o.date_livraison_prevue;

  return (
    <>
      {/* Format exact du papier thermique utilisé : 76mm de large,
          130mm de haut. Ne s'applique qu'à cette page (pas aux autres
          pages imprimables de l'app, comme les factures classiques). */}
      <style>{`
        @page {
          size: 76mm 130mm;
          margin: 2mm;
        }
      `}</style>

      <div className="mx-auto max-w-md p-6 print:w-[72mm] print:max-w-none print:p-0">
        <div className="mb-4 flex justify-end print:hidden">
          <ImprimerBouton />
        </div>

        <div className="rounded-2xl border-2 border-ink-900 p-6 print:rounded-none print:border-0 print:p-1 print:text-[10px]">
          {/* En-tête — icône à gauche, nom de boutique + téléphone à droite.
              Volontairement compact (peu d'espace vertical) : le papier
              thermique doit surtout donner de la place aux informations
              réellement utiles pour la livraison (destinataire, articles). */}
          <div className="mb-2 flex items-center gap-2 print:mb-1 print:gap-1">
            <ShoppingBag size={24} strokeWidth={2.5} className="shrink-0 text-ink-900 print:h-4 print:w-4" />
            <div>
              <p className="text-base font-bold leading-tight text-ink-900 print:text-xs">{o.profiles?.nom_boutique || `${o.profiles?.prenom} ${o.profiles?.nom}`}</p>
              <p className="text-xs font-bold leading-tight text-ink-900 print:text-[9px]">{o.profiles?.telephone}</p>
            </div>
          </div>

          {/* Bandeau "INFOS DU CLIENT" */}
          <div className="mb-3 rounded-xl bg-ink-900 py-1.5 text-center print:mb-1.5 print:rounded-md print:py-0.5">
            <p className="text-sm font-bold uppercase tracking-wide text-white print:text-[9px]">Infos du client</p>
          </div>

          <div className="mb-4 border-t-2 border-dashed border-ink-900 pt-4 print:mb-1.5 print:pt-1.5">
            <p className="text-xs font-bold uppercase text-ink-900 print:text-[8px]">Destinataire</p>
            <p className="text-lg font-bold text-ink-900 print:text-xs">{o.client_nom}</p>
            <p className="text-base font-bold text-ink-900 print:text-[10px]">{o.client_telephone}</p>
            <p className="mt-1 text-sm font-bold text-ink-900 print:mt-0.5 print:text-[9px]">{o.client_adresse}, {o.client_commune}</p>
            {o.zone === "hors_abidjan" && o.ville_expedition && (
              <p className="text-sm font-bold text-ink-900 print:text-[9px]">Expédition → {o.ville_expedition} ({o.gare || "gare non précisée"})</p>
            )}
          </div>

          <div className="mb-4 border-t-2 border-dashed border-ink-900 pt-4 print:mb-1.5 print:pt-1.5">
            <p className="mb-1 text-xs font-bold uppercase text-ink-900 print:mb-0.5 print:text-[8px]">Articles</p>
            <ul className="space-y-1 text-sm font-bold text-ink-900 print:space-y-0.5 print:text-[9px]">
              {o.order_items.map((item) => {
                const variante = item.product_variants
                  ? [item.product_variants.couleur, item.product_variants.taille].filter(Boolean).join(" / ")
                  : "";
                return (
                  <li key={item.id}>
                    <span className="font-bold">{item.quantite}×</span> {item.products?.nom}
                    {variante && ` (${variante})`}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="border-t-2 border-dashed border-ink-900 pt-4 print:pt-1.5">
            <div className="rounded-2xl border-2 border-ink-900 px-4 py-3 print:rounded-md print:px-2 print:py-1">
              <p className="text-sm font-bold text-ink-900 print:text-[9px]">Prix total (livraison incluse)</p>
              <p className="text-2xl font-bold text-ink-900 print:text-sm">{formatFCFA(prixTotal)}</p>
            </div>
          </div>

          <div className="mt-6 border-t-2 border-ink-900 pt-3 text-center text-xs font-bold text-ink-900 print:mt-1.5 print:pt-1 print:text-[8px]">
            <p>Réf. {o.numero_commande}</p>
            {dateLivraison && <p>Livraison prévue le {formatDate(dateLivraison)}</p>}
          </div>
        </div>
      </div>
    </>
  );
}
