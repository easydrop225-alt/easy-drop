"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { journaliserConnexion } from "@/lib/data/journal";

const MAX_ECHECS = 5;
const FENETRE_MINUTES = 15;

/**
 * Compte les échecs récents pour cet identifiant, via le client admin —
 * le client normal ne peut pas lire activity_logs (réservé aux admins par
 * RLS), il faut donc contourner volontairement cette règle ici, comme pour
 * l'écriture du journal.
 */
async function compterEchecsRecents(identifiant: string): Promise<number> {
  try {
    const admin = createAdminClient();
    const depuis = new Date(Date.now() - FENETRE_MINUTES * 60 * 1000).toISOString();
    const { count } = await admin
      .from("activity_logs")
      .select("id", { count: "exact", head: true })
      .eq("action", "connexion_echouee")
      .eq("details->>identifiant", identifiant)
      .gte("created_at", depuis);
    return count ?? 0;
  } catch {
    // Si la vérification échoue techniquement, on ne bloque jamais une
    // connexion légitime pour autant — on laisse juste passer.
    return 0;
  }
}

export async function connecter(_prevState: unknown, formData: FormData) {
  const identifiant = String(formData.get("identifiant") ?? "");
  const motDePasse = String(formData.get("motDePasse") ?? "");

  if (!identifiant || !motDePasse) {
    return { error: "Merci de remplir tous les champs." };
  }

  const echecsRecents = await compterEchecsRecents(identifiant);
  if (echecsRecents >= MAX_ECHECS) {
    return {
      error: `Trop de tentatives échouées pour ce compte. Réessaie dans ${FENETRE_MINUTES} minutes, ou utilise "Mot de passe oublié".`,
    };
  }

  const supabase = await createClient();

  // Si l'identifiant ressemble à un téléphone, on retrouve l'email associé.
  let email = identifiant;
  if (!identifiant.includes("@")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, telephone")
      .eq("telephone", identifiant)
      .maybeSingle();
    email = profile?.email ?? `${identifiant.replace("+", "")}@easydrop.local`;
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });
  if (error || !data.user) {
    // Échec de connexion : pas encore d'utilisateur identifié, on journalise
    // quand même l'identifiant tenté (utile pour repérer des tentatives
    // suspectes répétées), avec user_id à null.
    await journaliserConnexion("connexion_echouee", null, { identifiant });
    return { error: "Identifiants incorrects." };
  }

  await journaliserConnexion("connexion_reussie", data.user.id);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, statut")
    .eq("id", data.user.id)
    .single();

  if (profile?.role === "commercial" && profile.statut !== "valide") {
    redirect("/attente-validation");
  }

  if (profile?.role === "admin" || profile?.role === "super_admin") {
    redirect("/admin/dashboard");
  }

  redirect("/accueil");
}
