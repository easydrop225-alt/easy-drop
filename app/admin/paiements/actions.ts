"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Enregistre un versement pour un commercial et marque ses bénéfices
// "en_attente" correspondants comme "payé". La preuve (image) est déjà
// envoyée côté client vers le bucket "payment-proofs" ; on ne reçoit ici
// que son URL.
export async function enregistrerPaiement(input: {
  commercialId: string;
  montant: number;
  mode: "wave" | "orange_money" | "especes";
  numeroDepot: string;
  preuveUrl?: string;
}) {
  const supabase = await createClient();

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

  // Marque comme payés les bénéfices en attente de ce commercial
  // (jusqu'à hauteur du montant versé n'est pas géré finement ici : on
  // marque l'ensemble des bénéfices en attente comme payés, en supposant
  // que le versement couvre la totalité affichée dans "Paiements en attente").
  await supabase
    .from("profits")
    .update({ statut: "paye" })
    .eq("commercial_id", input.commercialId)
    .eq("statut", "en_attente");

  revalidatePath("/admin/paiements");
  return { success: true };
}
