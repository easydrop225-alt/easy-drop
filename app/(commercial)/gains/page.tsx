import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { formatFCFA } from "@/lib/utils";
import { HistoriqueGains } from "./historique-gains";
import type { Payment, Profit } from "@/types/database";

export default async function MesGainsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("commercial_id", user?.id)
    .order("date_paiement", { ascending: false });

  // "En attente de paiement" = bénéfices des commandes livrées avec succès,
  // pas encore marquées comme payées par l'admin.
  const { data: profits } = await supabase
    .from("profits")
    .select("*, orders!inner(statut)")
    .eq("commercial_id", user?.id)
    .eq("orders.statut", "livree");

  const paymentList = (payments ?? []) as Payment[];
  const profitList = (profits ?? []) as Profit[];
  const enAttente = profitList.filter((p) => p.statut === "en_attente").reduce((a, p) => a + Number(p.montant_benefice), 0);
  const dejaPaye = paymentList.filter((p) => p.statut === "paye").reduce((a, p) => a + Number(p.montant), 0);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Mes gains</h1>
      <div className="grid grid-cols-2 gap-4">
        <Card><CardTitle>En attente de paiement</CardTitle><CardValue>{formatFCFA(enAttente)}</CardValue></Card>
        <Card><CardTitle>Déjà payé</CardTitle><CardValue className="text-emerald-600">{formatFCFA(dejaPaye)}</CardValue></Card>
      </div>

      <HistoriqueGains payments={paymentList} />
    </div>
  );
}
