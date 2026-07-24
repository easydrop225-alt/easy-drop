"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function mettreAJourParametre(cle: string, valeur: unknown) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("settings")
    .upsert({ cle, valeur }, { onConflict: "cle" });

  if (error) return { error: error.message };
  revalidatePath("/admin/parametres");
  return { success: true };
}

export async function sauvegarderParametres(_prevState: unknown, formData: FormData) {
  const supabase = await createClient();

  const updates: { cle: string; valeur: unknown }[] = [
    { cle: "frais_livraison_abidjan", valeur: { min: Number(formData.get("fraisAbidjanMin")), max: Number(formData.get("fraisAbidjanMax")) } },
    { cle: "frais_livraison_hors_abidjan", valeur: { min: Number(formData.get("fraisHorsAbidjanMin")), max: Number(formData.get("fraisHorsAbidjanMax")) } },
    { cle: "whatsapp_numero", valeur: String(formData.get("whatsapp") ?? "") },
    { cle: "horaires", valeur: String(formData.get("horaires") ?? "") },
  ];

  for (const u of updates) {
    const { error } = await supabase.from("settings").upsert(u, { onConflict: "cle" });
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/parametres");
  return { success: true };
}
