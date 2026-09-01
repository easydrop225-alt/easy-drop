"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
    lien: "/accueil",
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

/**
 * Génère un mot de passe temporaire qui respecte déjà toutes les règles de
 * complexité (6+ caractères, majuscule, minuscule, chiffre, symbole).
 */
function genererMotDePasseTemporaire(): string {
  const majuscules = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const minuscules = "abcdefghjkmnpqrstuvwxyz";
  const chiffres = "23456789";
  const symboles = "!?#@%";
  const tirage = (jeu: string) => jeu[Math.floor(Math.random() * jeu.length)];

  const base = [tirage(majuscules), tirage(minuscules), tirage(chiffres), tirage(symboles)];
  const tousCaracteres = majuscules + minuscules + chiffres;
  for (let i = 0; i < 4; i++) base.push(tirage(tousCaracteres));

  // Mélange pour ne pas toujours avoir majuscule/minuscule/chiffre/symbole
  // exactement dans le même ordre.
  return base.sort(() => Math.random() - 0.5).join("");
}

/**
 * Réinitialise le mot de passe d'un commercial (utile pour les comptes créés
 * uniquement avec un numéro de téléphone, sans email, pour qui la
 * réinitialisation en libre-service par email est impossible). Le nouveau
 * mot de passe temporaire est retourné à l'admin, à transmettre au
 * commercial par un canal de son choix (WhatsApp, appel...).
 */
export async function reinitialiserMotDePasseCommercial(commercialId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié." };

  const { data: monProfil } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (monProfil?.role !== "admin" && monProfil?.role !== "super_admin") {
    return { error: "Action réservée aux administrateurs." };
  }

  const nouveauMotDePasse = genererMotDePasseTemporaire();

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(commercialId, { password: nouveauMotDePasse });
    if (error) return { error: error.message };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erreur de configuration." };
  }

  return { motDePasseTemporaire: nouveauMotDePasse };
}
