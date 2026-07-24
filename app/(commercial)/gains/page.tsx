import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { formatFCFA, formatDate } from "@/lib/utils";
import type { Payment, Profit } from "@/types/database";

export default async function MesGainsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("commercial_id", user?.id)
    .order("date_paiement", { ascending: false });

  const { data: profits } = await supabase
    .from("profits")
    .select("*")
    .eq("commercial_id", user?.id);

  const paymentList = (payments ?? []) as Payment[];
  const profitList = (profits ?? []) as Profit[];
  const enAttente = profitList.filter((p) => p.statut === "en_attente").reduce((a, p) => a + Number(p.montant_benefice), 0);
  const dejaPaye = paymentList.filter((p) => p.statut === "paye").reduce((a, p) => a + Number(p.montant), 0);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Mes gains</h1>
      <div className="grid grid-cols-2 gap-4">
        <Card><CardTitle>En attente de paiement</CardTitle><CardValue>{formatFCFA(enAttente)}</CardValue></Card>
        <Card><CardTitle>Déjà payé</CardTitle><CardValue>{formatFCFA(dejaPaye)}</CardValue></Card>
      </div>

      <Card className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-900/5 text-left text-ink-900/50">
              <th className="p-3">Date</th>
              <th className="p-3">Montant</th>
              <th className="p-3">Mode</th>
              <th className="p-3">Statut</th>
            </tr>
          </thead>
          <tbody>
            {paymentList.map((p) => (
              <tr key={p.id} className="border-b border-ink-900/5 last:border-0">
                <td className="p-3">{formatDate(p.date_paiement)}</td>
                <td className="p-3">{formatFCFA(p.montant)}</td>
                <td className="p-3">{p.mode}</td>
                <td className="p-3">{p.statut}</td>
              </tr>
            ))}
            {paymentList.length === 0 && (
              <tr><td colSpan={4} className="p-6 text-center text-ink-900/40">Aucun paiement enregistré.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
