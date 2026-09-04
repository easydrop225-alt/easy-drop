"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { inscriptionSchema } from "@/lib/validations/schemas";
import { recupererIP, journaliserConnexion } from "@/lib/data/journal";
import { redirect } from "next/navigation";

const MAX_INSCRIPTIONS_PAR_IP = 3;
const FENETRE_MINUTES = 30;

async function tropDinscriptionsRecentes(ip: string | null): Promise<boolean> {
  if (!ip) return false; // Pas d'IP détectée : on ne bloque pas sur une supposition.
  try {
    const admin = createAdminClient();
    const depuis = new Date(Date.now() - FENETRE_MINUTES * 60 * 1000).toISOString();
    const { count } = await admin
      .from("activity_logs")
      .select("id", { count: "exact", head: true })
      .eq("action", "inscription")
      .eq("ip_address", ip)
      .gte("created_at", depuis);
    return (count ?? 0) >= MAX_INSCRIPTIONS_PAR_IP;
  } catch {
    return false; // Une vérification qui échoue ne doit jamais bloquer une vraie inscription.
  }
}

export async function inscrireCommercial(_prevState: unknown, formData: FormData) {
  const raw = {
    nom: formData.get("nom"),
    prenom: formData.get("prenom"),
    telephone: formData.get("telephone"),
    email: formData.get("email") || "",
    motDePasse: formData.get("motDePasse"),
    nomBoutique: formData.get("nomBoutique"),
  };

  const parsed = inscriptionSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }

  const ip = await recupererIP();
  if (await tropDinscriptionsRecentes(ip)) {
    return { error: "Trop de comptes créés récemment depuis cette connexion. Réessaie plus tard." };
  }

  const supabase = await createClient();
  const { nom, prenom, telephone, email, motDePasse, nomBoutique } = parsed.data;

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: email || `${telephone.replace("+", "")}@easydrop.local`,
    password: motDePasse,
  });

  if (authError || !authData.user) {
    return { error: authError?.message ?? "Erreur lors de la création du compte" };
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: authData.user.id,
    role: "commercial",
    nom,
    prenom,
    telephone,
    email: email || null,
    nom_boutique: nomBoutique,
    statut: "valide",
  });

  if (profileError) {
    return { error: profileError.message };
  }

  await journaliserConnexion("inscription", authData.user.id, { telephone });

  redirect("/accueil?bienvenue=1");
}
