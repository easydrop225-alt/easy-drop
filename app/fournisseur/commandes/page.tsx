import { createClient } from "@/lib/supabase/server";
import { CommandeFournisseurCard } from "./commande-fournisseur-card";
import type { Order, OrderItem, Product } from "@/types/database";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mes commandes" };

export default async function FournisseurCommandesPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  // RLS ne renvoie ici QUE les commandes contenant au moins un produit de
  // ce fournisseur — inutile de refiltrer manuellement.
  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(*, products(*))")
    .order("created_at", { ascending: false });

  const list = (orders ?? []) as (Order & { order_items: (OrderItem & { products: Product })[] })[];
  const monId = session?.user.id ?? "";

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">Mes commandes</h1>
      <p className="mb-6 text-sm text-ink-900/60">
        Les commandes contenant au moins un de tes produits. Tu ne vois jamais quel commercial a réalisé la vente.
      </p>

      {list.length === 0 && <p className="text-ink-900/60">Aucune commande pour l&apos;instant.</p>}

      <div className="space-y-4">
        {list.map((order) => (
          <CommandeFournisseurCard key={order.id} order={order} monId={monId} />
        ))}
      </div>
    </div>
  );
}
