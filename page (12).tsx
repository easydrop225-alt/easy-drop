import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { formatFCFA, formatDate } from "@/lib/utils";
import { calculerBonusParrainage } from "@/lib/parrainage";
import { MarquerPayeParrainageBouton } from "./marquer-paye-parrainage-bouton";
import type { Profile, VersementParrainage } from "@/types/database";

export async function ParrainageSection() {
  const supabase = await createClient();

  const maintenant = new Date();
  const debutMoisPrecedent = new Date(maintenant.getFullYear(), maintenant.getMonth() - 1, 1);
  const finMoisPrecedent = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
  const moisPrecedentStr = debutMoisPrecedent.toISOString().slice(0, 10);

  const [{ data: points }, { data: orders }, { data: commerciaux }, { data: versements }] = await Promise.all([
    supabase.from("points_parrainage").select("parrain_id").gte("created_at", debutMoisPrecedent.toISOString()).lt("created_at", finMoisPrecedent.toISOString()),
    supabase.from("orders").select("commercial_id, created_at").eq("statut", "livree").gte("created_at", debutMoisPrecedent.toISOString()).lt("created_at", finMoisPrecedent.toISOString()),
    supabase.from("profiles").select("id, nom, prenom, nom_boutique").eq("role", "commercial"),
    supabase.from("versements_parrainage").select("*, profiles(nom, prenom, nom_boutique)").order("mois", { ascending: false }).limit(50),
  ]);

  const commerciauxParId = new Map((commerciaux ?? []).map((c) => [c.id, c as Profile]));

  const pointsParParrain: Record<string, number> = {};
  for (const p of (points ?? []) as { parrain_id: string }[]) {
    pointsParParrain[p.parrain_id] = (pointsParParrain[p.parrain_id] ?? 0) + 1;
  }

  const ventesParCommercial: Record<string, number> = {};
  for (const o of (orders ?? []) as { commercial_id: string }[]) {
    ventesParCommercial[o.commercial_id] = (ventesParCommercial[o.commercial_id] ?? 0) + 1;
  }

  const versementsList = (versements ?? []) as (VersementParrainage & { profiles: Pick<Profile, "nom" | "prenom" | "nom_boutique"> })[];
  const dejaPayes = new Set(versementsList.filter((v) => v.mois.slice(0, 10) === moisPrecedentStr).map((v) => v.parrain_id));

  const enAttente = Object.entries(pointsParParrain)
    .map(([parrainId, points]) => {
      const ventesPerso = ventesParCommercial[parrainId] ?? 0;
      const { niveau, valeurPoint, montant } = calculerBonusParrainage(points, ventesPerso);
      return { parrainId, commercial: commerciauxParId.get(parrainId), points, niveau, valeurPoint, montant };
    })
    .filter((x) => x.montant > 0 && !dejaPayes.has(x.parrainId));

  const nomMoisPrecedent = debutMoisPrecedent.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 text-lg font-medium">🤝 Paiements de parrainage — {nomMoisPrecedent}</h2>
        <p className="mb-3 text-xs text-ink-900/40">Bonus du mois précédent, désormais disponibles au paiement.</p>
        <div className="space-y-2">
          {enAttente.map((x) => (
            <Card key={x.parrainId} className="flex items-center justify-between">
              <div className="text-sm">
                <p className="font-medium">
                  {x.commercial?.prenom} {x.commercial?.nom}
                  {x.commercial?.nom_boutique && <span className="ml-2 rounded-full bg-beige-100 px-2 py-0.5 text-xs font-normal">🏪 {x.commercial.nom_boutique}</span>}
                </p>
                <p className="text-ink-900/50">{x.points} points × {x.valeurPoint} FCFA ({x.niveau}) = <span className="font-medium text-terracotta-600">{formatFCFA(x.montant)}</span></p>
              </div>
              <MarquerPayeParrainageBouton parrainId={x.parrainId} mois={moisPrecedentStr} montant={x.montant} />
            </Card>
          ))}
          {enAttente.length === 0 && (
            <Card><p className="text-sm text-ink-900/50">Aucun bonus de parrainage en attente pour {nomMoisPrecedent}.</p></Card>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">Historique des versements de parrainage</h2>
        <Card className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-900/5 text-left text-ink-900/50">
                <th className="p-3">Mois</th>
                <th className="p-3">Commercial</th>
                <th className="p-3">Montant</th>
                <th className="p-3">Payé le</th>
              </tr>
            </thead>
            <tbody>
              {versementsList.map((v) => (
                <tr key={v.id} className="border-b border-ink-900/5 last:border-0">
                  <td className="p-3">{new Date(v.mois).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</td>
                  <td className="p-3">{v.profiles?.prenom} {v.profiles?.nom} {v.profiles?.nom_boutique && <span className="text-xs text-ink-900/40">— {v.profiles.nom_boutique}</span>}</td>
                  <td className="p-3 font-medium">{formatFCFA(v.montant)}</td>
                  <td className="p-3 text-emerald-600">✓ {formatDate(v.created_at)}</td>
                </tr>
              ))}
              {versementsList.length === 0 && (
                <tr><td colSpan={4} className="p-6 text-center text-ink-900/40">Aucun versement de parrainage enregistré.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
