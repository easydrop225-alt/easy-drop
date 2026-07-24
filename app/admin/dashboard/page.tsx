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
  const commandesLivrees = list.filter((o) => o.statut === "livree" || o.statut === "terminee").length;
  const commandesAnnulees = list.filter((o) => o.statut === "annulee").length;
  const chiffreAffaires = itemList.reduce((a, i) => a + i.prix_vente_unitaire * i.quantite, 0);
  const beneficesGeneres = itemList.reduce((a, i) => a + Number(i.benefice_ligne), 0);
  const enAttenteValidation = commerciauxList.filter((c) => c.statut === "en_attente").length;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Dashboard administrateur</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card><CardTitle>Commandes aujourd'hui</CardTitle><CardValue>{commandesJour}</CardValue></Card>
        <Card><CardTitle>Cette semaine</CardTitle><CardValue>{commandesSemaine}</CardValue></Card>
        <Card><CardTitle>Ce mois</CardTitle><CardValue>{commandesMois}</CardValue></Card>
        <Card><CardTitle>Livrées / Annulées</CardTitle><CardValue>{commandesLivrees} / {commandesAnnulees}</CardValue></Card>
        <Card><CardTitle>Chiffre d'affaires</CardTitle><CardValue>{formatFCFA(chiffreAffaires)}</CardValue></Card>
        <Card><CardTitle>Bénéfices générés</CardTitle><CardValue>{formatFCFA(beneficesGeneres)}</CardValue></Card>
        <Card><CardTitle>Commerciaux actifs</CardTitle><CardValue>{commerciauxList.length}</CardValue></Card>
        <Card>
          <CardTitle>Inscriptions en attente</CardTitle>
          <CardValue>{enAttenteValidation}</CardValue>
          {enAttenteValidation > 0 && (
            <a href="/admin/commerciaux/validation" className="mt-2 inline-block text-xs text-terracotta-600 underline">
              Traiter maintenant
            </a>
          )}
        </Card>
      </div>
    </div>
  );
}
