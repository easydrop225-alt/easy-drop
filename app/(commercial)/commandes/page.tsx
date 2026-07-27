import { createClient } from "@/lib/supabase/server";
import { HistoriqueCommandesCommercial } from "@/components/commandes/historique-commandes-commercial";
import type { Order } from "@/types/database";

export default async function MesCommandesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("commercial_id", user?.id)
    .order("created_at", { ascending: false });

  const list = (orders ?? []) as Order[];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Mes commandes</h1>
        <a href="/commandes/nouvelle" className="rounded-xl bg-terracotta-500 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-600">
          Nouvelle commande
        </a>
      </div>
      <HistoriqueCommandesCommercial orders={list} />
    </div>
  );
}
