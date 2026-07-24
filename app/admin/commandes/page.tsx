import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { StatutBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { Order, Profile, OrderItem, Product, Media } from "@/types/database";

type OrderComplete = Order & {
  profiles: Pick<Profile, "nom" | "prenom" | "telephone">;
  order_items: (OrderItem & { products: Product })[];
};

export default async function AdminCommandesPage() {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*, profiles(nom, prenom, telephone), order_items(*, products(*))")
    .order("created_at", { ascending: false });

  const list = (orders ?? []) as OrderComplete[];

  const productIds = Array.from(new Set(list.flatMap((o) => o.order_items.map((i) => i.product_id))));
  const { data: media } = productIds.length
    ? await supabase.from("media").select("*").in("product_id", productIds).eq("type", "image").order("ordre")
    : { data: [] as Media[] };

  const imageParProduit = new Map<string, string>();
  for (const m of (media ?? []) as Media[]) {
    if (!imageParProduit.has(m.product_id)) imageParProduit.set(m.product_id, m.url);
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Toutes les commandes</h1>
      <div className="space-y-3">
        {list.map((order) => {
          const premierArticle = order.order_items[0];
          const image = premierArticle ? imageParProduit.get(premierArticle.product_id) : undefined;

          return (
            <a key={order.id} href={`/admin/commandes/${order.id}`}>
              <Card className="flex flex-col gap-4 transition hover:shadow-md sm:flex-row sm:items-center">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-beige-100">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt="" className="h-full w-full object-cover" />
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
                  </div>
                  <div>
                    <p className="text-ink-900/50">Commercial</p>
                    <p>{order.profiles?.prenom} {order.profiles?.nom}</p>
                    <p className="text-xs text-ink-900/40">{order.profiles?.telephone}</p>
                  </div>
                  <div>
                    <p className="text-ink-900/50">Client</p>
                    <p>{order.client_nom}</p>
                    <p className="text-xs text-ink-900/40">{order.client_telephone}</p>
                  </div>
                  <div className="col-span-2 sm:col-span-2">
                    <p className="text-ink-900/50">Adresse de livraison</p>
                    <p>{order.client_adresse}, {order.client_commune}</p>
                  </div>
                  <div>
                    <p className="text-ink-900/50">Date</p>
                    <p>{formatDate(order.created_at)}</p>
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
        {list.length === 0 && <p className="text-ink-900/60">Aucune commande.</p>}
      </div>
    </div>
  );
}
