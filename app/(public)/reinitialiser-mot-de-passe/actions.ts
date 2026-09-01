"use server";

import { createClient } from "@/lib/supabase/server";
import { reinitialiserMotDePasseSchema } from "@/lib/validations/schemas";

export async function definirNouveauMotDePasse(_prevState: unknown, formData: FormData) {
  const parsed = reinitialiserMotDePasseSchema.safeParse({ motDePasse: formData.get("motDePasse") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Mot de passe invalide." };
  }

  const supabase = await createClient();

  // À ce stade, Supabase a déjà ouvert une session "recovery" temporaire
  // grâce au lien cliqué dans l'email — updateUser() en profite pour
  // changer le mot de passe sans redemander l'ancien.
  const { error } = await supabase.auth.updateUser({ password: parsed.data.motDePasse });
  if (error) {
    return { error: "Le lien a peut-être expiré. Redemande un nouveau lien de réinitialisation." };
  }

  return { succes: true };
}
