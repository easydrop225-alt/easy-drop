import { createClient } from "@/lib/supabase/server";
import { dateIlYA3Mois } from "@/lib/utils";
import type { Payment, Profile, Profit } from "@/types/database";
import { FiltreCommercialPaiements } from "./filtre-commercial-paiements";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Paiements" };


interface CommandeDue {
  orderId: string;
  numeroCommande: string;
  montant: number;
}

interface CommercialDu {
  commercial: Profile;
  montantDu: number;
  dateDebut: string;
  dateFin: string;
  commandes: CommandeDue[];
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
      .select("*, profiles(*), orders!inner(statut, numero_commande)")
      .eq("statut", "en_attente")
      .eq("orders.statut", "livree")
      .order("created_at"),
  ]);

  const list = (payments ?? []) as (Payment & { profiles: Pick<Profile, "nom" | "prenom" | "nom_boutique"> })[];
  const profitList = (profitsEnAttente ?? []) as (Profit & { profiles: Profile; orders: { statut: string; numero_commande: string } })[];

  // Regroupe les bénéfices en attente par commercial — en gardant le détail
  // de chaque commande, pour permettre de choisir précisément lesquelles un
  // versement couvre (plutôt que de tout marquer payé d'un coup).
  const parCommercial = new Map<string, CommercialDu>();
  for (const p of profitList) {
    const existing = parCommercial.get(p.commercial_id);
    const commandeDue: CommandeDue = {
      orderId: p.order_id,
      numeroCommande: p.orders.numero_commande,
      montant: Number(p.montant_benefice),
    };
    if (existing) {
      existing.montantDu += commandeDue.montant;
      existing.commandes.push(commandeDue);
      if (p.created_at < existing.dateDebut) existing.dateDebut = p.created_at;
      if (p.created_at > existing.dateFin) existing.dateFin = p.created_at;
    } else {
      parCommercial.set(p.commercial_id, {
        commercial: p.profiles,
        montantDu: commandeDue.montant,
        dateDebut: p.created_at,
        dateFin: p.created_at,
        commandes: [commandeDue],
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
