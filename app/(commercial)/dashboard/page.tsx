import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { StatutBadge } from "@/components/ui/badge";
import dynamic from "next/dynamic";

// Chargé en différé : Recharts est une librairie assez lourde, pas besoin
// de la faire attendre à l'utilisateur avant que le reste de la page
// (chiffres, dernières commandes) ne s'affiche.
const PeriodChart = dynamic(() => import("@/components/rapports/period-chart").then((m) => m.PeriodChart));
import { formatFCFA, dateIlYA3Mois } from "@/lib/utils";
import { calculerBonusParrainage, premierJourDuMois } from "@/lib/parrainage";
import type { PointJournalier } from "@/lib/stats/aggregate";
import type { Order, OrderItem } from "@/types/database";

export default async function DashboardCommercialPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const commercialId = user?.id ?? "";
  const debutMois = premierJourDuMois(new Date());

  // Les 3 requêtes ci-dessous sont indépendantes : on les lance en parallèle
  // (au lieu de les enchaîner une par une) pour diviser par ~3 le temps
  // d'attente réseau de cette page.
  //
  // - "resume" : juste le nécessaire (statut, dates) pour TOUT l'historique
  //   du commercial, sans les lignes de commande (order_items) — utilisé
  //   pour les totaux globaux (taux de réussite) et la liste des dernières
  //   commandes. Beaucoup plus léger qu'un historique complet avec détails.
  // - "recentesAvecLignes" : uniquement les 3 derniers mois, MAIS avec le
  //   détail des lignes (order_items), nécessaire pour calculer les
  //   bénéfices (aujourd'hui + graphique). Les commandes plus anciennes ne
  //   sont plus affichées en détail nulle part dans l'app de toute façon.
  // - "pointsCeMois" : parrainage du mois en cours.
  const [{ data: resume }, { data: recentesAvecLignes }, { data: pointsCeMois }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, numero_commande, client_nom, statut, created_at, date_relance")
      .eq("commercial_id", commercialId)
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("id, statut, created_at, order_items(benefice_ligne)")
      .eq("commercial_id", commercialId)
      .gte("created_at", dateIlYA3Mois()),
    supabase
      .from("points_parrainage")
      .select("id")
      .eq("parrain_id", commercialId)
      .gte("created_at", debutMois),
  ]);

  type Resume = Pick<Order, "id" | "numero_commande" | "client_nom" | "statut" | "created_at" | "date_relance">;
  type RecenteAvecLignes = Pick<Order, "id" | "statut" | "created_at"> & { order_items: Pick<OrderItem, "benefice_ligne">[] };

  const list = (resume ?? []) as Resume[];
  const recentes = (recentesAvecLignes ?? []) as RecenteAvecLignes[];
  const beneficeParOrderId = new Map(
    recentes.map((o) => [o.id, o.order_items.reduce((a, i) => a + Number(i.benefice_ligne), 0)])
  );

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
  const commandesNonLivreesJour = commandesJour.filter((o) => o.statut === "annulee");
  const commandesEnCoursJour = commandesJour.filter((o) => o.statut === "confirmation" || o.statut === "traitement" || o.statut === "livraison" || o.statut === "relance");

  const beneficeAttendu = commandesEnCoursJour.reduce((acc, o) => acc + (beneficeParOrderId.get(o.id) ?? 0), 0);
  const beneficeRealiseJour = commandesLivreesJour.reduce((acc, o) => acc + (beneficeParOrderId.get(o.id) ?? 0), 0);

  const commandesLivreesTotal = list.filter((o) => o.statut === "livree").length;
  const commandesNonLivreesTotal = list.filter((o) => o.statut === "annulee").length;
  const resolues = commandesLivreesTotal + commandesNonLivreesTotal;
  const tauxReussite = resolues > 0 ? Math.round((commandesLivreesTotal / resolues) * 100) : 0;

  // Graphique de performance : basé sur les 3 derniers mois (comme "Mes
  // commandes"), pas sur la totalité de l'historique.
  const beneficeParJour = new Map<string, number>();
  for (const o of recentes) {
    if (o.statut !== "livree") continue;
    const jour = o.created_at.slice(0, 10);
    const benef = beneficeParOrderId.get(o.id) ?? 0;
    beneficeParJour.set(jour, (beneficeParJour.get(jour) ?? 0) + benef);
  }
  const pointsBenefice: PointJournalier[] = Array.from(beneficeParJour.entries()).map(([date, valeur]) => ({ date, valeur }));

  const dernieresCommandes = list.slice(0, 10);

  // Parrainage — points du mois et valeur du point selon le niveau actuel.
  const ventesPersonnellesCeMois = list.filter((o) => o.statut === "livree" && o.created_at >= debutMois).length;
  const nombrePointsParrainage = pointsCeMois?.length ?? 0;
  const { niveau, valeurPoint, montant: bonusParrainageEstime } = calculerBonusParrainage(nombrePointsParrainage, ventesPersonnellesCeMois);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Mon dashboard</h1>

      <div>
        <h2 className="mb-3 text-lg font-medium">Aujourd'hui</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          <Card>
            <CardTitle>Commandes aujourd'hui</CardTitle>
            <CardValue>{commandesJour.length}</CardValue>
          </Card>
          <Card>
            <CardTitle>Livrées / Non livrées</CardTitle>
            <CardValue>{commandesLivreesJour.length} / {commandesNonLivreesJour.length}</CardValue>
          </Card>
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
            <CardTitle>Taux de réussite (global)</CardTitle>
            <CardValue>{tauxReussite}%</CardValue>
          </Card>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">🤝 Mon parrainage ce mois</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <Card>
            <CardTitle>Points de parrainage</CardTitle>
            <CardValue>{nombrePointsParrainage}</CardValue>
          </Card>
          <Card>
            <CardTitle>Valeur du point (Niveau {niveau})</CardTitle>
            <CardValue>{formatFCFA(valeurPoint)}</CardValue>
          </Card>
          <Card>
            <CardTitle>Bonus de parrainage estimé</CardTitle>
            <CardValue className="text-terracotta-600">{formatFCFA(bonusParrainageEstime)}</CardValue>
          </Card>
        </div>
        <a href="/parrainage" className="mt-2 inline-block text-sm text-terracotta-600 underline">Voir tous les détails du parrainage →</a>
      </div>

      <PeriodChart
        title="Ma performance (bénéfice réalisé)"
        data={pointsBenefice}
        type="line"
        defaultGranularite="semaine"
        unite="fcfa"
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
