import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { formatFCFA, formatDate } from "@/lib/utils";
import type { Payment, Profile } from "@/types/database";
import { PaiementForm } from "./form";

export default async function AdminPaiementsPage() {
  const supabase = await createClient();
  const { data: payments } = await supabase
    .from("payments")
    .select("*, profiles(nom, prenom)")
    .order("date_paiement", { ascending: false });

  const { data: commerciaux } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "commercial")
    .eq("statut", "valide");

  const list = (payments ?? []) as (Payment & { profiles: Pick<Profile, "nom" | "prenom"> })[];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Paiements des gains</h1>

      <PaiementForm commerciaux={(commerciaux ?? []) as Profile[]} />

      <Card className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-900/5 text-left text-ink-900/50">
              <th className="p-3">Date</th>
              <th className="p-3">Commercial</th>
              <th className="p-3">Montant</th>
              <th className="p-3">Mode</th>
              <th className="p-3">Statut</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className="border-b border-ink-900/5 last:border-0">
                <td className="p-3">{formatDate(p.date_paiement)}</td>
                <td className="p-3">{p.profiles?.prenom} {p.profiles?.nom}</td>
                <td className="p-3">{formatFCFA(p.montant)}</td>
                <td className="p-3">{p.mode}</td>
                <td className="p-3">{p.statut}</td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-ink-900/40">Aucun paiement enregistré.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
