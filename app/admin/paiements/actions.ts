"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Enregistre un versement pour un commercial et marque ses bénéfices
// "en_attente" correspondants comme "payé". La preuve (image) est déjà
// envoyée côté client vers le bucket "payment-proofs" ; on ne reçoit ici
// que son URL.
export async function enregistrerVersementParrainage(input: {
  parrainId: string;
  mois: string; // YYYY-MM-01
  montant: number;
  mode: string;
  referencePaiement?: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("versements_parrainage").insert({
    parrain_id: input.parrainId,
    mois: input.mois,
    montant: input.montant,
    mode: input.mode,
    reference_paiement: input.referencePaiement ?? null,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/paiements");
  return { success: true };
}

export async function enregistrerPaiement(input: {
  commercialId: string;
  montant: number;
  mode: "wave" | "orange_money" | "especes";
  numeroDepot: string;
  preuveUrl?: string;
  orderIds: string[];
}) {
  const supabase = await createClient();

  if (!input.orderIds || input.orderIds.length === 0) {
    return { error: "Aucune commande sélectionnée pour ce versement." };
  }

  const { error } = await supabase.from("payments").insert({
    commercial_id: input.commercialId,
    montant: input.montant,
    mode: input.mode,
    reference_paiement: input.numeroDepot || null,
    preuve_url: input.preuveUrl ?? null,
    statut: "paye",
    date_paiement: new Date().toISOString().slice(0, 10),
  });

  if (error) return { error: error.message };

  // Ne marque payés QUE les bénéfices des commandes explicitement
  // sélectionnées par l'admin — plus question de solder automatiquement
  // tout ce qui est en attente pour ce commercial, au risque de marquer
  // "payé" des commandes que ce versement précis ne couvre pas.
  const { error: profitsError } = await supabase
    .from("profits")
    .update({ statut: "paye" })
    .eq("commercial_id", input.commercialId)
    .eq("statut", "en_attente")
    .in("order_id", input.orderIds);

  if (profitsError) return { error: profitsError.message };

  revalidatePath("/admin/paiements");
  revalidatePath("/admin/commandes");
  return { success: true };
}
