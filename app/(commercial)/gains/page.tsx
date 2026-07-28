import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { formatFCFA, dateIlYA3Mois } from "@/lib/utils";
import { HistoriqueGains } from "./historique-gains";
import type { Payment, Profit } from "@/types/database";

export default async function MesGainsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Historique affiché (tableau) limité aux 3 derniers mois pour rester
  // rapide — mais le total "Déjà payé" ci-dessous reste calculé sur TOUT
  // l'historique, pour ne jamais sous-estimer ce qui a réellement été payé.
  const { data: paymentsTout } = await supabase
    .from("payments")
    .select("*")
    .eq("commercial_id", user?.id)
    .order("date_paiement", { ascending: false });

  const paymentListTout = (paymentsTout ?? []) as Payment[];
  const paymentListRecent = paymentListTout.filter((p) => p.date_paiement >= dateIlYA3Mois().slice(0, 10));

  // "En attente de paiement" = bénéfices des commandes livrées avec succès,
  // pas encore marquées comme payées par l'admin (jamais limité dans le temps).
  const { data: profits } = await supabase
    .from("profits")
    .select("*, orders!inner(statut)")
    .eq("commercial_id", user?.id)
    .eq("orders.statut", "livree");

  const profitList = (profits ?? []) as Profit[];
  const enAttente = profitList.filter((p) => p.statut === "en_attente").reduce((a, p) => a + Number(p.montant_benefice), 0);
  const dejaPaye = paymentListTout.filter((p) => p.statut === "paye").reduce((a, p) => a + Number(p.montant), 0);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Mes gains</h1>
      <div className="grid grid-cols-2 gap-4">
        <Card><CardTitle>En attente de paiement</CardTitle><CardValue>{formatFCFA(enAttente)}</CardValue></Card>
        <Card><CardTitle>Déjà payé (total)</CardTitle><CardValue className="text-emerald-600">{formatFCFA(dejaPaye)}</CardValue></Card>
      </div>
      <p className="text-xs text-ink-900/40">Historique ci-dessous limité aux 3 derniers mois (le total "Déjà payé" ci-dessus reste sur l'ensemble de l'historique).</p>

      <HistoriqueGains payments={paymentListRecent} />
    </div>
  );
}
