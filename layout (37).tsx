import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { formatFCFA, formatDate } from "@/lib/utils";
import { ImprimerBouton } from "./imprimer-bouton";
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

      <div className="rounded-2xl border-2 border-ink-900 p-6 print:rounded-none print:border-0">
        <div className="mb-4 text-center">
          <p className="text-lg font-bold">{o.profiles?.nom_boutique || `${o.profiles?.prenom} ${o.profiles?.nom}`}</p>
          <p className="text-sm text-ink-900/70">{o.profiles?.telephone}</p>
        </div>

        <div className="mb-4 border-t border-dashed border-ink-900/20 pt-4">
          <p className="text-xs uppercase text-ink-900/50">Destinataire</p>
          <p className="text-lg font-semibold">{o.client_nom}</p>
          <p className="text-base">{o.client_telephone}</p>
          <p className="mt-1 text-sm">{o.client_adresse}, {o.client_commune}</p>
          {o.zone === "hors_abidjan" && o.ville_expedition && (
            <p className="text-sm text-ink-900/60">Expédition → {o.ville_expedition} ({o.gare || "gare non précisée"})</p>
          )}
        </div>

        <div className="mb-4 border-t border-dashed border-ink-900/20 pt-4">
          <p className="mb-1 text-xs uppercase text-ink-900/50">Articles</p>
          <ul className="space-y-1 text-sm">
            {o.order_items.map((item) => {
              const variante = item.product_variants
                ? [item.product_variants.couleur, item.product_variants.taille].filter(Boolean).join(" / ")
                : "";
              return (
                <li key={item.id}>
                  <span className="font-medium">{item.quantite}×</span> {item.products?.nom}
                  {variante && ` (${variante})`}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="border-t border-dashed border-ink-900/20 pt-4 text-right">
          <p className="text-sm text-ink-900/60">Prix total (livraison incluse)</p>
          <p className="text-2xl font-bold">{formatFCFA(prixTotal)}</p>
        </div>

        <div className="mt-6 border-t border-ink-900/10 pt-3 text-center text-xs text-ink-900/40">
          <p>Réf. {o.numero_commande}</p>
          {dateLivraison && <p>Livraison prévue le {formatDate(dateLivraison)}</p>}
        </div>
      </div>
    </div>
  );
}
