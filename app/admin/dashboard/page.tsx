import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { formatFCFA } from "@/lib/utils";
import type { Order, OrderItem, Profile } from "@/types/database";

function calculerMetriquesPeriode(
  orders: Order[],
  items: OrderItem[],
  debutPeriode: Date
) {
  const commandesPeriode = orders.filter((o) => new Date(o.created_at) >= debutPeriode);

  const livreesPeriode = orders.filter(
    (o) => o.statut === "livree" && new Date(o.updated_at) >= debutPeriode
  );
  const nonLivreesPeriode = orders.filter(
    (o) => o.statut === "annulee" && new Date(o.updated_at) >= debutPeriode
  );

  const idsLivreesPeriode = new Set(livreesPeriode.map((o) => o.id));
  const itemsLivresPeriode = items.filter((i) => idsLivreesPeriode.has(i.order_id));

  const beneficeCommerciaux = itemsLivresPeriode.reduce((a, i) => a + Number(i.benefice_ligne), 0);
  const caGlobal = itemsLivresPeriode.reduce((a, i) => a + i.prix_vente_unitaire * i.quantite, 0);
  const caFournisseur = itemsLivresPeriode.reduce((a, i) => a + i.prix_fournisseur_unitaire * i.quantite, 0);

  return {
    nombreCommandes: commandesPeriode.length,
    nombreLivrees: livreesPeriode.length,
    nombreNonLivrees: nonLivreesPeriode.length,
    beneficeCommerciaux,
    caGlobal,
    caFournisseur,
  };
}

function LigneMetriques({ titre, metriques }: { titre: string; metriques: ReturnType<typeof calculerMetriquesPeriode> }) {
  return (
    <div>
      <h2 className="mb-3 text-lg font-medium">{titre}</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardTitle>Commandes</CardTitle>
          <CardValue>{metriques.nombreCommandes}</CardValue>
        </Card>
        <Card>
          <CardTitle>Livrées / Annulées</CardTitle>
          <CardValue>{metriques.nombreLivrees} / {metriques.nombreNonLivrees}</CardValue>
        </Card>
        <Card>
          <CardTitle>Bénéfices des commerciaux</CardTitle>
          <CardValue>{formatFCFA(metriques.beneficeCommerciaux)}</CardValue>
        </Card>
        <Card>
          <CardTitle>CA global (ventes)</CardTitle>
          <CardValue>{formatFCFA(metriques.caGlobal)}</CardValue>
        </Card>
        <Card>
          <CardTitle>CA fournisseur</CardTitle>
          <CardValue>{formatFCFA(metriques.caFournisseur)}</CardValue>
        </Card>
      </div>
    </div>
  );
}

export default async function DashboardAdminPage() {
  const supabase = await createClient();

  const debutJour = new Date(); debutJour.setHours(0, 0, 0, 0);
  const debutSemaine = new Date(); debutSemaine.setDate(debutSemaine.getDate() - 7);
  const debutMois = new Date(); debutMois.setDate(1); debutMois.setHours(0, 0, 0, 0);
  const debutAnnee = new Date(); debutAnnee.setMonth(0, 1); debutAnnee.setHours(0, 0, 0, 0);

  // Les 3 requêtes sont indépendantes : on les lance en parallèle plutôt
  // que l'une après l'autre, pour diviser le temps d'attente réseau.
  const [{ data: orders }, { data: items }, { data: commerciaux }] = await Promise.all([
    supabase.from("orders").select("*"),
    supabase.from("order_items").select("*"),
    supabase.from("profiles").select("*").eq("role", "commercial"),
  ]);

  const list = (orders ?? []) as Order[];
  const itemList = (items ?? []) as OrderItem[];
  const commerciauxList = (commerciaux ?? []) as Profile[];

  const metriquesJour = calculerMetriquesPeriode(list, itemList, debutJour);
  const metriquesSemaine = calculerMetriquesPeriode(list, itemList, debutSemaine);
  const metriquesMois = calculerMetriquesPeriode(list, itemList, debutMois);
  const metriquesAnnee = calculerMetriquesPeriode(list, itemList, debutAnnee);

  const nouveauxCommerciaux7j = commerciauxList.filter((c) => new Date(c.created_at) >= debutSemaine).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard administrateur</h1>
        <a href="/admin/rapports" className="text-sm font-medium text-terracotta-600 underline">
          Voir les rapports détaillés →
        </a>
      </div>

      <LigneMetriques titre="Aujourd'hui" metriques={metriquesJour} />
      <LigneMetriques titre="Cette semaine (7 derniers jours)" metriques={metriquesSemaine} />
      <LigneMetriques titre="Ce mois-ci" metriques={metriquesMois} />
      <LigneMetriques titre="Cette année" metriques={metriquesAnnee} />

      <div>
        <h2 className="mb-3 text-lg font-medium">Commerciaux</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card><CardTitle>Commerciaux (total)</CardTitle><CardValue>{commerciauxList.length}</CardValue></Card>
          <Card><CardTitle>Nouveaux (7 derniers jours)</CardTitle><CardValue>{nouveauxCommerciaux7j}</CardValue></Card>
        </div>
      </div>
    </div>
  );
}
