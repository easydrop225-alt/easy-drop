import { createClient } from "@/lib/supabase/server";
import { StatutBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
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
      <Card className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-900/5 text-left text-ink-900/50">
              <th className="p-3">Numéro</th>
              <th className="p-3">Client</th>
              <th className="p-3">Commune</th>
              <th className="p-3">Date</th>
              <th className="p-3">Statut</th>
            </tr>
          </thead>
          <tbody>
            {list.map((order) => (
              <tr key={order.id} className="border-b border-ink-900/5 last:border-0 hover:bg-beige-50">
                <td className="p-3"><a href={`/commandes/${order.id}`} className="font-medium">{order.numero_commande}</a></td>
                <td className="p-3">{order.client_nom}</td>
                <td className="p-3">{order.client_commune}</td>
                <td className="p-3">{formatDate(order.created_at)}</td>
                <td className="p-3"><StatutBadge statut={order.statut} /></td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-ink-900/40">Aucune commande pour l'instant.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
