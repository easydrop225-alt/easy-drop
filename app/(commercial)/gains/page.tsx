import { createClient } from "@/lib/supabase/server";
import { dateIlYA3Mois } from "@/lib/utils";
import { GainsFiltres } from "./gains-filtres";
import type { Payment, Profit } from "@/types/database";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mes gains" };


export default async function MesGainsPage() {
  const supabase = await createClient();
  // getSession() lit la session depuis le cookie, sans appel réseau
  // systématique vers Supabase à chaque affichage de page (contrairement
  // à getUser()) — l'id récupéré ici ne sert qu'à filtrer les propres
  // données de la personne, déjà protégées indépendamment par les
  // policies RLS de la base de données.
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  // Historique affiché (tableau) limité aux 3 derniers mois pour rester
  // rapide — mais le total "Déjà payé" ci-dessous reste calculé sur TOUT
  // l'historique, pour ne jamais sous-estimer ce qui a réellement été payé.
  const [{ data: paymentsTout }, { data: profits }] = await Promise.all([
    supabase.from("payments").select("*").eq("commercial_id", user?.id ?? "").order("date_paiement", { ascending: false }),
    supabase.from("profits").select("*, orders!inner(statut)").eq("commercial_id", user?.id ?? "").eq("orders.statut", "livree"),
  ]);

  const paymentListTout = (paymentsTout ?? []) as Payment[];
  const paymentListRecent = paymentListTout.filter((p) => p.date_paiement >= dateIlYA3Mois().slice(0, 10));

  const profitList = (profits ?? []) as Profit[];
  const enAttente = profitList.filter((p) => p.statut === "en_attente").reduce((a, p) => a + Number(p.montant_benefice), 0);
  const dejaPaye = paymentListTout.filter((p) => p.statut === "paye").reduce((a, p) => a + Number(p.montant), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Mes gains</h1>
      <GainsFiltres
        paymentsRecent={paymentListRecent}
        enAttente={enAttente}
        dejaPaye={dejaPaye}
      />
    </div>
  );
}
