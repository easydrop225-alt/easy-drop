import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { HistoriqueCommandesCommercial } from "@/components/commandes/historique-commandes-commercial";
import { dateIlYA3Mois } from "@/lib/utils";
import type { Order } from "@/types/database";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mes commandes" };


export default async function MesCommandesPage() {
  const supabase = await createClient();
  // getSession() lit la session depuis le cookie, sans appel réseau
  // systématique vers Supabase à chaque affichage de page (contrairement
  // à getUser()) — l'id récupéré ici ne sert qu'à filtrer les propres
  // données de la personne, déjà protégées indépendamment par les
  // policies RLS de la base de données.
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  // Historique limité aux 3 derniers mois pour rester rapide même avec
  // beaucoup de commandes accumulées (n'affecte pas les rapports annuels).
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("commercial_id", user?.id)
    .gte("created_at", dateIlYA3Mois())
    .order("created_at", { ascending: false });

  const list = (orders ?? []) as Order[];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Mes commandes</h1>
        <Link href="/commandes/nouvelle" className="rounded-xl bg-terracotta-500 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-600">
          Nouvelle commande
        </Link>
      </div>
      <p className="mb-4 text-xs text-ink-900/40">Affichage des 3 derniers mois.</p>
      <HistoriqueCommandesCommercial orders={list} />
    </div>
  );
}
