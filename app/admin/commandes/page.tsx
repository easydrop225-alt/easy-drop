import { createClient } from "@/lib/supabase/server";
import { CommandesGroupeesAdmin, type OrderComplete } from "@/components/commandes/commandes-groupees-admin";
import type { Media } from "@/types/database";

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

  const imageParProduit: Record<string, string | undefined> = {};
  for (const m of (media ?? []) as Media[]) {
    if (!(m.product_id in imageParProduit)) imageParProduit[m.product_id] = m.url;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Toutes les commandes</h1>
      <CommandesGroupeesAdmin orders={list} imageParProduit={imageParProduit} />
    </div>
  );
}
