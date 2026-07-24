import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { StatutBadge } from "@/components/ui/badge";
import { formatFCFA } from "@/lib/utils";
import type { Order, OrderItem, Profit } from "@/types/database";

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

  // Commandes du jour (toutes commandes du commercial créées aujourd'hui).
  const debutJour = new Date(); debutJour.setHours(0, 0, 0, 0);
  const { data: commandesJourData } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("commercial_id", user?.id)
    .gte("created_at", debutJour.toISOString())
    .order("created_at", { ascending: false });

  const commandesJour = (commandesJourData ?? []) as (Order & { order_items: OrderItem[] })[];
  const ventesJour = commandesJour.reduce(
    (acc, o) => acc + o.order_items.reduce((a, i) => a + i.prix_vente_unitaire * i.quantite, 0),
    0
  );
  const beneficeJour = commandesJour.reduce(
    (acc, o) => acc + o.order_items.reduce((a, i) => a + Number(i.benefice_ligne), 0),
    0
  );

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
        <h2 className="mb-3 text-lg font-medium">Résumé de mes commandes du jour</h2>
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardTitle>Commandes aujourd'hui</CardTitle>
            <CardValue>{commandesJour.length}</CardValue>
          </Card>
          <Card>
            <CardTitle>Ventes du jour</CardTitle>
            <CardValue>{formatFCFA(ventesJour)}</CardValue>
          </Card>
          <Card>
            <CardTitle>Bénéfice du jour</CardTitle>
            <CardValue>{formatFCFA(beneficeJour)}</CardValue>
          </Card>
        </div>
        <Card className="mt-3 p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-900/5 text-left text-ink-900/50">
                <th className="p-3">Numéro</th>
                <th className="p-3">Client</th>
                <th className="p-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {commandesJour.map((order) => (
                <tr key={order.id} className="border-b border-ink-900/5 last:border-0">
                  <td className="p-3"><a href={`/commandes/${order.id}`} className="font-medium hover:underline">{order.numero_commande}</a></td>
                  <td className="p-3">{order.client_nom}</td>
                  <td className="p-3"><StatutBadge statut={order.statut} /></td>
                </tr>
              ))}
              {commandesJour.length === 0 && (
                <tr><td colSpan={3} className="p-6 text-center text-ink-900/40">Aucune commande créée aujourd'hui.</td></tr>
              )}
            </tbody>
          </table>
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
                  <td className="p-3"><a href={`/commandes/${order.id}`} className="hover:underline">{order.numero_commande}</a></td>
                  <td className="p-3">{order.client_nom}</td>
                  <td className="p-3"><StatutBadge statut={order.statut} /></td>
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
