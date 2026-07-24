"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function validerCommercial(commercialId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("profiles")
    .update({
      statut: "valide",
      date_validation: new Date().toISOString(),
      valide_par: user?.id ?? null,
    })
    .eq("id", commercialId);

  if (error) return { error: error.message };

  await supabase.from("notifications").insert({
    destinataire_id: commercialId,
    type: "compte_valide",
    titre: "Ton compte a été validé",
    message: "Tu peux maintenant accéder au catalogue et créer des commandes.",
    lien: "/dashboard",
  });

  revalidatePath("/admin/commerciaux/validation");
  return { success: true };
}

export async function refuserCommercial(commercialId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ statut: "refuse" }).eq("id", commercialId);
  if (error) return { error: error.message };
  revalidatePath("/admin/commerciaux/validation");
  return { success: true };
}

export async function desactiverCommercial(commercialId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ statut: "desactive" }).eq("id", commercialId);
  if (error) return { error: error.message };
  revalidatePath("/admin/commerciaux");
  return { success: true };
}
