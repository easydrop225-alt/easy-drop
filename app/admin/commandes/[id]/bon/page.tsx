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
    <div className="mx-auto max-w-md p-6 print:p-0">
      <div className="mb-4 flex justify-end print:hidden">
        <ImprimerBouton />
      </div>

      <div className="rounded-2xl border-2 border-ink-900 p-6 print:rounded-none print:border-0 print:p-4">
        {/* En-tête — icône à gauche, nom de boutique + téléphone à droite.
            Volontairement compact (peu d'espace vertical) : le papier
            thermique doit surtout donner de la place aux informations
            réellement utiles pour la livraison (destinataire, articles). */}
        <div className="mb-2 flex items-center gap-2">
          <ShoppingBag size={24} strokeWidth={2.5} className="shrink-0 text-ink-900" />
          <div>
            <p className="text-base font-bold leading-tight text-ink-900">{o.profiles?.nom_boutique || `${o.profiles?.prenom} ${o.profiles?.nom}`}</p>
            <p className="text-xs font-bold leading-tight text-ink-900">{o.profiles?.telephone}</p>
          </div>
        </div>

        {/* Bandeau "INFOS DU CLIENT" */}
        <div className="mb-3 rounded-xl bg-ink-900 py-1.5 text-center">
          <p className="text-sm font-bold uppercase tracking-wide text-white">Infos du client</p>
        </div>

        <div className="mb-4 border-t-2 border-dashed border-ink-900 pt-4">
          <p className="text-xs font-bold uppercase text-ink-900">Destinataire</p>
          <p className="text-lg font-bold text-ink-900">{o.client_nom}</p>
          <p className="text-base font-bold text-ink-900">{o.client_telephone}</p>
          <p className="mt-1 text-sm font-bold text-ink-900">{o.client_adresse}, {o.client_commune}</p>
          {o.zone === "hors_abidjan" && o.ville_expedition && (
            <p className="text-sm font-bold text-ink-900">Expédition → {o.ville_expedition} ({o.gare || "gare non précisée"})</p>
          )}
        </div>

        <div className="mb-4 border-t-2 border-dashed border-ink-900 pt-4">
          <p className="mb-1 text-xs font-bold uppercase text-ink-900">Articles</p>
          <ul className="space-y-1 text-sm font-bold text-ink-900">
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

        <div className="border-t-2 border-dashed border-ink-900 pt-4">
          <div className="rounded-2xl border-2 border-ink-900 px-4 py-3">
            <p className="text-sm font-bold text-ink-900">Prix total (livraison incluse)</p>
            <p className="text-2xl font-bold text-ink-900">{formatFCFA(prixTotal)}</p>
          </div>
        </div>

        <div className="mt-6 border-t-2 border-ink-900 pt-3 text-center text-xs font-bold text-ink-900">
          <p>Réf. {o.numero_commande}</p>
          {dateLivraison && <p>Livraison prévue le {formatDate(dateLivraison)}</p>}
        </div>
      </div>
    </div>
  );
}
