import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { StatutBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { Order, Profile } from "@/types/database";

export default async function AdminCommandesPage() {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*, profiles(nom, prenom)")
    .order("created_at", { ascending: false });

  const list = (orders ?? []) as (Order & { profiles: Pick<Profile, "nom" | "prenom"> })[];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Toutes les commandes</h1>
      <Card className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-900/5 text-left text-ink-900/50">
              <th className="p-3">Numéro</th>
              <th className="p-3">Commercial</th>
              <th className="p-3">Client</th>
              <th className="p-3">Commune</th>
              <th className="p-3">Date</th>
              <th className="p-3">Statut</th>
            </tr>
          </thead>
          <tbody>
            {list.map((order) => (
              <tr key={order.id} className="border-b border-ink-900/5 last:border-0">
                <td className="p-3 font-medium">{order.numero_commande}</td>
                <td className="p-3">{order.profiles?.prenom} {order.profiles?.nom}</td>
                <td className="p-3">{order.client_nom}</td>
                <td className="p-3">{order.client_commune}</td>
                <td className="p-3">{formatDate(order.created_at)}</td>
                <td className="p-3"><StatutBadge statut={order.statut} /></td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-ink-900/40">Aucune commande.</td></tr>}
          </tbody>
        </table>
      </Card>
      <p className="mt-4 text-xs text-ink-900/40">
        Le changement de statut en un clic (dropdown par ligne) se branche sur `changerStatutCommande` dans `actions.ts`.
      </p>
    </div>
  );
}
