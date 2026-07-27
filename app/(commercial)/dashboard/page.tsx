import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { StatutBadge } from "@/components/ui/badge";
import { PeriodChart } from "@/components/rapports/period-chart";
import { formatFCFA } from "@/lib/utils";
import type { PointJournalier } from "@/lib/stats/aggregate";
import type { Order, OrderItem } from "@/types/database";

export default async function DashboardCommercialPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: ordersData } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("commercial_id", user?.id)
    .order("created_at", { ascending: false });

  const list = ((ordersData ?? []) as (Order & { order_items: OrderItem[] | null })[]).map((o) => ({
    ...o,
    order_items: o.order_items ?? [],
  }));

  const debutJour = new Date(); debutJour.setHours(0, 0, 0, 0);
  const debutJourStr = debutJour.toISOString().slice(0, 10);
  const demain = new Date(debutJour); demain.setDate(demain.getDate() + 1);
  const demainStr = demain.toISOString().slice(0, 10);

  // "Commandes du jour" = commandes créées aujourd'hui + relances prévues
  // pour demain (elles réapparaissent la veille pour que le commercial
  // puisse s'y préparer à l'avance).
  const commandesJour = list.filter(
    (o) =>
      o.created_at.slice(0, 10) === debutJourStr ||
      (o.statut === "relance" && o.date_relance === demainStr)
  );
  const commandesLivreesJour = commandesJour.filter((o) => o.statut === "livree");
  const commandesEnCoursJour = commandesJour.filter((o) => o.statut === "nouvelle" || o.statut === "relance");

  // Bénéfice attendu = commandes du jour pas encore résolues (nouvelle/relance).
  const beneficeAttendu = commandesEnCoursJour.reduce(
    (acc, o) => acc + o.order_items.reduce((a, i) => a + Number(i.benefice_ligne), 0), 0
  );
  // Bénéfice réalisé = commandes du jour livrées avec succès.
  const beneficeRealiseJour = commandesLivreesJour.reduce(
    (acc, o) => acc + o.order_items.reduce((a, i) => a + Number(i.benefice_ligne), 0), 0
  );

  const commandesLivreesTotal = list.filter((o) => o.statut === "livree").length;
  const commandesNonLivreesTotal = list.filter((o) => o.statut === "non_livree").length;
  const resolues = commandesLivreesTotal + commandesNonLivreesTotal;
  const tauxReussite = resolues > 0 ? Math.round((commandesLivreesTotal / resolues) * 100) : 0;

  // Séries journalières pour le graphique de performance (bénéfice réalisé par jour).
  const beneficeParJour = new Map<string, number>();
  for (const o of list) {
    if (o.statut !== "livree") continue;
    const jour = o.created_at.slice(0, 10);
    const benef = o.order_items.reduce((a, i) => a + Number(i.benefice_ligne), 0);
    beneficeParJour.set(jour, (beneficeParJour.get(jour) ?? 0) + benef);
  }
  const pointsBenefice: PointJournalier[] = Array.from(beneficeParJour.entries()).map(([date, valeur]) => ({ date, valeur }));

  const dernieresCommandes = list.slice(0, 10);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Mon dashboard</h1>

      <div>
        <h2 className="mb-3 text-lg font-medium">Aujourd'hui</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardTitle>Bénéfice attendu</CardTitle>
            <CardValue>{formatFCFA(beneficeAttendu)}</CardValue>
            <p className="mt-1 text-xs text-ink-900/40">Commandes en cours (non résolues)</p>
          </Card>
          <Card>
            <CardTitle>Bénéfice réalisé</CardTitle>
            <CardValue>{formatFCFA(beneficeRealiseJour)}</CardValue>
            <p className="mt-1 text-xs text-ink-900/40">Commandes livrées avec succès</p>
          </Card>
          <Card>
            <CardTitle>Commandes aujourd'hui</CardTitle>
            <CardValue>{commandesJour.length}</CardValue>
          </Card>
          <Card>
            <CardTitle>Taux de réussite (global)</CardTitle>
            <CardValue>{tauxReussite}%</CardValue>
          </Card>
        </div>
      </div>

      <PeriodChart
        title="Ma performance (bénéfice réalisé)"
        data={pointsBenefice}
        type="line"
        defaultGranularite="semaine"
        valueFormatter={formatFCFA}
      />

      <div>
        <h2 className="mb-3 text-lg font-medium">Mes commandes du jour</h2>
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
              {dernieresCommandes.map((order) => (
                <tr key={order.id} className="border-b border-ink-900/5 last:border-0">
                  <td className="p-3"><a href={`/commandes/${order.id}`} className="hover:underline">{order.numero_commande}</a></td>
                  <td className="p-3">{order.client_nom}</td>
                  <td className="p-3"><StatutBadge statut={order.statut} /></td>
                </tr>
              ))}
              {dernieresCommandes.length === 0 && (
                <tr><td colSpan={3} className="p-6 text-center text-ink-900/40">Aucune commande pour l'instant.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
