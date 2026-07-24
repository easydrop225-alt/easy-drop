import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { formatFCFA, formatDate } from "@/lib/utils";
import type { Payment, Profile, Profit } from "@/types/database";
import { PaiementEnAttenteCard } from "./paiement-en-attente-card";

interface CommercialDu {
  commercial: Profile;
  montantDu: number;
  dateDebut: string;
  dateFin: string;
}

export default async function AdminPaiementsPage() {
  const supabase = await createClient();

  const { data: payments } = await supabase
    .from("payments")
    .select("*, profiles(nom, prenom)")
    .order("date_paiement", { ascending: false });

  const { data: profitsEnAttente } = await supabase
    .from("profits")
    .select("*, profiles(*)")
    .eq("statut", "en_attente")
    .order("created_at");

  const list = (payments ?? []) as (Payment & { profiles: Pick<Profile, "nom" | "prenom"> })[];
  const profitList = (profitsEnAttente ?? []) as (Profit & { profiles: Profile })[];

  // Regroupe les bénéfices en attente par commercial.
  const parCommercial = new Map<string, CommercialDu>();
  for (const p of profitList) {
    const existing = parCommercial.get(p.commercial_id);
    if (existing) {
      existing.montantDu += Number(p.montant_benefice);
      if (p.created_at < existing.dateDebut) existing.dateDebut = p.created_at;
      if (p.created_at > existing.dateFin) existing.dateFin = p.created_at;
    } else {
      parCommercial.set(p.commercial_id, {
        commercial: p.profiles,
        montantDu: Number(p.montant_benefice),
        dateDebut: p.created_at,
        dateFin: p.created_at,
      });
    }
  }
  const commerciauxDus = Array.from(parCommercial.values()).filter((c) => c.montantDu > 0);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Paiements des gains</h1>

      <div>
        <h2 className="mb-3 text-lg font-medium">Paiements en attente</h2>
        <div className="space-y-3">
          {commerciauxDus.map((c) => (
            <PaiementEnAttenteCard
              key={c.commercial.id}
              commercial={c.commercial}
              montantDu={c.montantDu}
              dateDebut={c.dateDebut}
              dateFin={c.dateFin}
            />
          ))}
          {commerciauxDus.length === 0 && (
            <Card><p className="text-sm text-ink-900/50">Aucun versement en attente pour l'instant.</p></Card>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">Historique des versements</h2>
        <Card className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-900/5 text-left text-ink-900/50">
                <th className="p-3">Date</th>
                <th className="p-3">Commercial</th>
                <th className="p-3">Montant</th>
                <th className="p-3">Mode</th>
                <th className="p-3">Référence</th>
                <th className="p-3">Preuve</th>
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
                  <td className="p-3">{p.reference_paiement ?? "—"}</td>
                  <td className="p-3">
                    {p.preuve_url ? (
                      <a href={p.preuve_url} target="_blank" rel="noreferrer" className="text-terracotta-600 underline">Voir</a>
                    ) : "—"}
                  </td>
                  <td className="p-3">{p.statut}</td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-ink-900/40">Aucun paiement enregistré.</td></tr>}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
