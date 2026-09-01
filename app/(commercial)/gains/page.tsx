import { createClient } from "@/lib/supabase/server";
import { dateIlYA3Mois } from "@/lib/utils";
import { calculerBonusParrainage, premierJourDuMois } from "@/lib/parrainage";
import { GainsFiltres } from "./gains-filtres";
import type { Payment, Profit } from "@/types/database";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mes gains" };


export default async function MesGainsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const debutMois = premierJourDuMois(new Date());

  // Historique affiché (tableau) limité aux 3 derniers mois pour rester
  // rapide — mais le total "Déjà payé" ci-dessous reste calculé sur TOUT
  // l'historique, pour ne jamais sous-estimer ce qui a réellement été payé.
  const [{ data: paymentsTout }, { data: profits }, { data: mesVentesLivrees }, { data: pointsCeMois }] = await Promise.all([
    supabase.from("payments").select("*").eq("commercial_id", user?.id ?? "").order("date_paiement", { ascending: false }),
    supabase.from("profits").select("*, orders!inner(statut)").eq("commercial_id", user?.id ?? "").eq("orders.statut", "livree"),
    supabase.from("orders").select("id").eq("commercial_id", user?.id ?? "").eq("statut", "livree").gte("created_at", debutMois),
    supabase.from("points_parrainage").select("id, filleul_id").eq("parrain_id", user?.id ?? "").gte("created_at", debutMois),
  ]);

  const paymentListTout = (paymentsTout ?? []) as Payment[];
  const paymentListRecent = paymentListTout.filter((p) => p.date_paiement >= dateIlYA3Mois().slice(0, 10));

  const profitList = (profits ?? []) as Profit[];
  const enAttente = profitList.filter((p) => p.statut === "en_attente").reduce((a, p) => a + Number(p.montant_benefice), 0);
  const dejaPaye = paymentListTout.filter((p) => p.statut === "paye").reduce((a, p) => a + Number(p.montant), 0);

  const ventesPersonnellesCeMois = mesVentesLivrees?.length ?? 0;
  const nombrePoints = pointsCeMois?.length ?? 0;
  const filleulsActifs = new Set((pointsCeMois ?? []).map((pt) => pt.filleul_id)).size;
  const { niveau, valeurPoint, montant } = calculerBonusParrainage(nombrePoints, ventesPersonnellesCeMois);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Mes gains</h1>
      <GainsFiltres
        paymentsRecent={paymentListRecent}
        enAttente={enAttente}
        dejaPaye={dejaPaye}
        resumeParrainage={{ points: nombrePoints, filleulsActifs, niveau, valeurPoint, bonusEstime: montant }}
      />
    </div>
  );
}
