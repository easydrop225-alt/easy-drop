"use server";

import { createClient } from "@/lib/supabase/server";
import { journaliserConnexion } from "@/lib/data/journal";

/**
 * Journalise la déconnexion côté serveur (pour capturer l'adresse IP),
 * avant que le client ne termine la déconnexion effective de sa session.
 */
export async function journaliserDeconnexionAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await journaliserConnexion("deconnexion", user.id);
  }
}
