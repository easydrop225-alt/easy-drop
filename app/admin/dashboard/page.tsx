import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { formatFCFA } from "@/lib/utils";
import type { Order, OrderItem, Profile } from "@/types/database";

export default async function DashboardAdminPage() {
  const supabase = await createClient();

  const debutJour = new Date(); debutJour.setHours(0, 0, 0, 0);
  const debutSemaine = new Date(); debutSemaine.setDate(debutSemaine.getDate() - 7);
  const debutMois = new Date(); debutMois.setDate(1);

  const { data: orders } = await supabase.from("orders").select("*");
  const { data: items } = await supabase.from("order_items").select("*");
  const { data: commerciaux } = await supabase.from("profiles").select("*").eq("role", "commercial");

  const list = (orders ?? []) as Order[];
  const itemList = (items ?? []) as OrderItem[];
  const commerciauxList = (commerciaux ?? []) as Profile[];

  const commandesJour = list.filter((o) => new Date(o.created_at) >= debutJour).length;
  const commandesSemaine = list.filter((o) => new Date(o.created_at) >= debutSemaine).length;
  const commandesMois = list.filter((o) => new Date(o.created_at) >= debutMois).length;
  const commandesLivrees = list.filter((o) => o.statut === "livree").length;
  const commandesNonLivrees = list.filter((o) => o.statut === "non_livree").length;
  const chiffreAffaires = itemList.reduce((a, i) => a + i.prix_vente_unitaire * i.quantite, 0);
  const beneficesGeneres = itemList.reduce((a, i) => a + Number(i.benefice_ligne), 0);
  const enAttenteValidation = commerciauxList.filter((c) => c.statut === "en_attente").length;

  // Commandes validées (livrées) aujourd'hui.
  const ordersValideesAujourdhui = list.filter(
    (o) => o.statut === "livree" && new Date(o.updated_at) >= debutJour
  );
  const idsValideesAujourdhui = new Set(ordersValideesAujourdhui.map((o) => o.id));
  const itemsValidesAujourdhui = itemList.filter((i) => idsValideesAujourdhui.has(i.order_id));

  const beneficeCommerciauxJour = itemsValidesAujourdhui.reduce((a, i) => a + Number(i.benefice_ligne), 0);
  const caAdminJour = itemsValidesAujourdhui.reduce((a, i) => a + i.prix_fournisseur_unitaire * i.quantite, 0);

  // Nouveaux commerciaux (7 derniers jours).
  const nouveauxCommerciaux7j = commerciauxList.filter((c) => new Date(c.created_at) >= debutSemaine).length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard administrateur</h1>
        <a href="/admin/rapports" className="text-sm font-medium text-terracotta-600 underline">
          Voir les rapports détaillés →
        </a>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">Aujourd'hui (commandes validées / livrées)</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <Card><CardTitle>Commandes livrées aujourd'hui</CardTitle><CardValue>{ordersValideesAujourdhui.length}</CardValue></Card>
          <Card><CardTitle>Bénéfices des commerciaux (jour)</CardTitle><CardValue>{formatFCFA(beneficeCommerciauxJour)}</CardValue></Card>
          <Card><CardTitle>Chiffre d'affaires admin (jour)</CardTitle><CardValue>{formatFCFA(caAdminJour)}</CardValue></Card>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card><CardTitle>Commandes aujourd'hui</CardTitle><CardValue>{commandesJour}</CardValue></Card>
        <Card><CardTitle>Cette semaine</CardTitle><CardValue>{commandesSemaine}</CardValue></Card>
        <Card><CardTitle>Ce mois</CardTitle><CardValue>{commandesMois}</CardValue></Card>
        <Card><CardTitle>Livrées / Non livrées</CardTitle><CardValue>{commandesLivrees} / {commandesNonLivrees}</CardValue></Card>
        <Card><CardTitle>Chiffre d'affaires total</CardTitle><CardValue>{formatFCFA(chiffreAffaires)}</CardValue></Card>
        <Card><CardTitle>Bénéfices générés (total)</CardTitle><CardValue>{formatFCFA(beneficesGeneres)}</CardValue></Card>
        <Card><CardTitle>Commerciaux (total)</CardTitle><CardValue>{commerciauxList.length}</CardValue></Card>
        <Card><CardTitle>Nouveaux commerciaux (7j)</CardTitle><CardValue>{nouveauxCommerciaux7j}</CardValue></Card>
      </div>

      {enAttenteValidation > 0 && (
        <Card>
          <CardTitle>Inscriptions en attente</CardTitle>
          <CardValue>{enAttenteValidation}</CardValue>
          <a href="/admin/commerciaux/validation" className="mt-2 inline-block text-xs text-terracotta-600 underline">
            Traiter maintenant
          </a>
        </Card>
      )}
    </div>
  );
}
