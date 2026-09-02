import { createClient } from "@/lib/supabase/server";
import { PeriodChart, CommercialPerformanceChart } from "@/components/rapports/charts-lazy";
import { formatFCFA } from "@/lib/utils";
import type { PointJournalier } from "@/lib/stats/aggregate";
import type { Order, OrderItem, Profile } from "@/types/database";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Rapports" };


export default async function RapportsPage() {
  const supabase = await createClient();

  // Les graphiques de cette page comparent des périodes (jour/semaine/mois),
  // pas besoin de conserver l'historique complet depuis le premier jour de
  // la plateforme en mémoire à chaque affichage — 12 mois glissants
  // couvrent largement toutes les vues proposées ici.
  const unAnAvant = new Date();
  unAnAvant.setFullYear(unAnAvant.getFullYear() - 1);

  const [{ data: orders }, { data: profiles }] = await Promise.all([
    supabase.from("orders").select("*, order_items(*)").gte("created_at", unAnAvant.toISOString()),
    supabase.from("profiles").select("*").eq("role", "commercial"),
  ]);

  const list = ((orders ?? []) as (Order & { order_items: OrderItem[] | null })[]).map((o) => ({
    ...o,
    order_items: o.order_items ?? [],
  }));
  const commerciaux = (profiles ?? []) as Profile[];
  const nomParId = new Map(
    commerciaux.map((c) => [c.id, c.nom_boutique ? `${c.prenom} ${c.nom} / ${c.nom_boutique}` : `${c.prenom} ${c.nom}`])
  );

  // --- 1. CA mensuel (commandes livrées) : global (ventes) + fournisseur ---
  const caParJour = new Map<string, number>();
  const caFournisseurParJour = new Map<string, number>();
  // --- 2. Livraisons réussies par zone ---
  const livraisonsAbidjanParJour = new Map<string, number>();
  const livraisonsHorsAbidjanParJour = new Map<string, number>();
  // --- 3. Commandes reçues (toutes, quel que soit le statut) ---
  const commandesRecuesParJour = new Map<string, number>();
  // --- 4. Performance par commercial (commandes livrées) ---
  const parCommercialParJour = new Map<string, Map<string, number>>();

  for (const o of list) {
    const jour = o.created_at.slice(0, 10);
    commandesRecuesParJour.set(jour, (commandesRecuesParJour.get(jour) ?? 0) + 1);

    if (o.statut === "livree") {
      const ca = o.order_items.reduce((a, i) => a + i.prix_vente_unitaire * i.quantite, 0);
      caParJour.set(jour, (caParJour.get(jour) ?? 0) + ca);

      const caFournisseur = o.order_items.reduce((a, i) => a + i.prix_fournisseur_unitaire * i.quantite, 0);
      caFournisseurParJour.set(jour, (caFournisseurParJour.get(jour) ?? 0) + caFournisseur);

      if (o.zone === "abidjan") {
        livraisonsAbidjanParJour.set(jour, (livraisonsAbidjanParJour.get(jour) ?? 0) + 1);
      } else {
        livraisonsHorsAbidjanParJour.set(jour, (livraisonsHorsAbidjanParJour.get(jour) ?? 0) + 1);
      }

      const mapCommercial = parCommercialParJour.get(o.commercial_id) ?? new Map<string, number>();
      mapCommercial.set(jour, (mapCommercial.get(jour) ?? 0) + 1);
      parCommercialParJour.set(o.commercial_id, mapCommercial);
    }
  }

  const toPoints = (map: Map<string, number>): PointJournalier[] =>
    Array.from(map.entries()).map(([date, valeur]) => ({ date, valeur }));

  const parCommercial = Array.from(parCommercialParJour.entries()).map(([id, map]) => ({
    nom: nomParId.get(id) ?? "Commercial inconnu",
    points: toPoints(map),
  }));

  const caTotal = Array.from(caParJour.values()).reduce((a, v) => a + v, 0);
  const livraisonsTotal =
    Array.from(livraisonsAbidjanParJour.values()).reduce((a, v) => a + v, 0) +
    Array.from(livraisonsHorsAbidjanParJour.values()).reduce((a, v) => a + v, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Rapports et statistiques</h1>
        <p className="mt-1 text-sm text-ink-900/60">
          Vue détaillée pour mieux programmer tes stratégies de vente avec les commerciaux.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-ink-900/5 bg-surface p-4">
          <p className="text-sm text-ink-900/50">Chiffre d'affaires (commandes livrées)</p>
          <p className="mt-1 text-2xl font-semibold">{formatFCFA(caTotal)}</p>
        </div>
        <div className="rounded-2xl border border-ink-900/5 bg-surface p-4">
          <p className="text-sm text-ink-900/50">Livraisons réussies (total)</p>
          <p className="mt-1 text-2xl font-semibold">{livraisonsTotal}</p>
        </div>
        <div className="rounded-2xl border border-ink-900/5 bg-surface p-4">
          <p className="text-sm text-ink-900/50">Commandes reçues (total)</p>
          <p className="mt-1 text-2xl font-semibold">{list.length}</p>
        </div>
      </div>

      <PeriodChart
        title="Performance mensuelle des ventes (chiffre d'affaires)"
        data={toPoints(caParJour)}
        data2={toPoints(caFournisseurParJour)}
        label="CA global (ventes)"
        label2="CA fournisseur"
        type="line"
        defaultGranularite="mois"
        unite="fcfa"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <PeriodChart
          title="Livraisons réussies — Abidjan"
          data={toPoints(livraisonsAbidjanParJour)}
          type="bar"
          defaultGranularite="mois"
        />
        <PeriodChart
          title="Livraisons réussies — Hors Abidjan"
          data={toPoints(livraisonsHorsAbidjanParJour)}
          type="bar"
          defaultGranularite="mois"
        />
      </div>

      <PeriodChart
        title="Commandes reçues (par jour)"
        data={toPoints(commandesRecuesParJour)}
        type="bar"
        defaultGranularite="jour"
      />

      <CommercialPerformanceChart parCommercial={parCommercial} />
    </div>
  );
}
