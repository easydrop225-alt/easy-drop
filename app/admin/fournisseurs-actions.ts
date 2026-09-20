"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

/**
 * Crée un compte fournisseur externe — jamais d'auto-inscription publique,
 * uniquement l'admin peut en créer un, après avoir recensé le fournisseur
 * lui-même (accord, coordonnées...).
 */
export async function creerFournisseur(input: {
  nom: string;
  prenom: string;
  telephone: string;
  email?: string;
  motDePasse: string;
  nomEntreprise?: string;
}) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "Session expirée." };

  const admin = createAdminClient();
  const { data: monProfil } = await admin.from("profiles").select("role").eq("id", session.user.id).single();
  if (monProfil?.role !== "admin" && monProfil?.role !== "super_admin") {
    return { error: "Réservé à l'administration." };
  }

  const email = input.email || `${input.telephone.replace(/[^0-9]/g, "")}@fournisseur.easydrop.local`;

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password: input.motDePasse,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return { error: authError?.message ?? "Erreur lors de la création du compte." };
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: authData.user.id,
    role: "fournisseur_externe",
    nom: input.nom,
    prenom: input.prenom,
    telephone: input.telephone,
    email: input.email || null,
    nom_boutique: input.nomEntreprise || null,
    statut: "valide",
  });

  if (profileError) {
    // Nettoie le compte auth orphelin si la création du profil échoue.
    await admin.auth.admin.deleteUser(authData.user.id);
    return { error: profileError.message };
  }

  revalidatePath("/admin/fournisseurs");
  return { success: true, email };
}

export async function listerFournisseurs() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "fournisseur_externe")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function desactiverFournisseur(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ statut: "desactive" }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/fournisseurs");
  return { success: true };
}
