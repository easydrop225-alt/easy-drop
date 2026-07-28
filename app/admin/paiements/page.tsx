import { createClient } from "@/lib/supabase/server";
import { dateIlYA3Mois } from "@/lib/utils";
import type { Payment, Profile, Profit } from "@/types/database";
import { FiltreCommercialPaiements } from "./filtre-commercial-paiements";

interface CommercialDu {
  commercial: Profile;
  montantDu: number;
  dateDebut: string;
  dateFin: string;
}

export default async function AdminPaiementsPage() {
  const supabase = await createClient();

  // Historique affiché limité aux 3 derniers mois (performance) — n'affecte
  // pas les paiements en attente ci-dessous, calculés sur tout l'historique.
  const [{ data: payments }, { data: profitsEnAttente }] = await Promise.all([
    supabase
      .from("payments")
      .select("*, profiles(nom, prenom, nom_boutique)")
      .gte("date_paiement", dateIlYA3Mois().slice(0, 10))
      .order("date_paiement", { ascending: false }),
    supabase
      .from("profits")
      .select("*, profiles(*), orders!inner(statut)")
      .eq("statut", "en_attente")
      .eq("orders.statut", "livree")
      .order("created_at"),
  ]);

  const list = (payments ?? []) as (Payment & { profiles: Pick<Profile, "nom" | "prenom" | "nom_boutique"> })[];
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
      <FiltreCommercialPaiements commerciauxDus={commerciauxDus} payments={list} />
    </div>
  );
}
