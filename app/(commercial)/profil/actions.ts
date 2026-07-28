"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const TRENTE_JOURS_MS = 30 * 24 * 60 * 60 * 1000;

export async function modifierTelephone(nouveauTelephone: string) {
  if (!/^\+225\d{10}$/.test(nouveauTelephone)) {
    return { error: "Format attendu : +225XXXXXXXXXX" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée, merci de te reconnecter." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("telephone_modifie_le")
    .eq("id", user.id)
    .single();

  if (profile?.telephone_modifie_le) {
    const derniereModif = new Date(profile.telephone_modifie_le).getTime();
    const maintenant = Date.now();
    if (maintenant - derniereModif < TRENTE_JOURS_MS) {
      const prochainChangement = new Date(derniereModif + TRENTE_JOURS_MS);
      return {
        error: `Tu as déjà changé ton numéro récemment. Prochain changement possible le ${prochainChangement.toLocaleDateString("fr-FR")}.`,
      };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ telephone: nouveauTelephone, telephone_modifie_le: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/profil");
  return { success: true };
}

export async function modifierNomBoutique(nouveauNom: string) {
  if (nouveauNom.trim().length < 2) {
    return { error: "Le nom de la boutique doit contenir au moins 2 caractères." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée, merci de te reconnecter." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("nom_boutique_modifie_le")
    .eq("id", user.id)
    .single();

  if (profile?.nom_boutique_modifie_le) {
    const derniereModif = new Date(profile.nom_boutique_modifie_le).getTime();
    const maintenant = Date.now();
    if (maintenant - derniereModif < TRENTE_JOURS_MS) {
      const prochainChangement = new Date(derniereModif + TRENTE_JOURS_MS);
      return {
        error: `Tu as déjà changé le nom de ta boutique récemment. Prochain changement possible le ${prochainChangement.toLocaleDateString("fr-FR")}.`,
      };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ nom_boutique: nouveauNom.trim(), nom_boutique_modifie_le: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/profil");
  return { success: true };
}
