import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { formatFCFA } from "@/lib/utils";
import type { Order, Profit } from "@/types/database";

export default async function DashboardCommercialPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("commercial_id", user?.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: profits } = await supabase
    .from("profits")
    .select("*")
    .eq("commercial_id", user?.id);

  const list = (orders ?? []) as Order[];
  const profitList = (profits ?? []) as Profit[];

  const totalBenefices = profitList.reduce((acc, p) => acc + Number(p.montant_benefice), 0);
  const beneficesEnAttente = profitList.filter((p) => p.statut === "en_attente").reduce((acc, p) => acc + Number(p.montant_benefice), 0);
  const commandesLivrees = list.filter((o) => o.statut === "livree" || o.statut === "terminee").length;
  const commandesAnnulees = list.filter((o) => o.statut === "annulee").length;
  const tauxReussite = list.length > 0 ? Math.round((commandesLivrees / list.length) * 100) : 0;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Mon dashboard</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardTitle>Bénéfices totaux</CardTitle>
          <CardValue>{formatFCFA(totalBenefices)}</CardValue>
        </Card>
        <Card>
          <CardTitle>Gains en attente</CardTitle>
          <CardValue>{formatFCFA(beneficesEnAttente)}</CardValue>
        </Card>
        <Card>
          <CardTitle>Commandes livrées</CardTitle>
          <CardValue>{commandesLivrees}</CardValue>
        </Card>
        <Card>
          <CardTitle>Taux de réussite</CardTitle>
          <CardValue>{tauxReussite}%</CardValue>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">Dernières commandes</h2>
        <Card className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-900/5 text-left text-ink-900/50">
                <th className="p-3">Numéro</th>
                <th className="p-3">Client</th>
                <th className="p-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {list.map((order) => (
                <tr key={order.id} className="border-b border-ink-900/5 last:border-0">
                  <td className="p-3">{order.numero_commande}</td>
                  <td className="p-3">{order.client_nom}</td>
                  <td className="p-3">{order.statut}</td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr><td colSpan={3} className="p-6 text-center text-ink-900/40">Aucune commande pour l'instant.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
      <p className="text-xs text-ink-900/40">Commandes annulées : {commandesAnnulees}</p>
    </div>
  );
}
