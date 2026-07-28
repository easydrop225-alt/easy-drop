"use server";

import { createClient } from "@/lib/supabase/server";
import { inscriptionSchema } from "@/lib/validations/schemas";
import { redirect } from "next/navigation";

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

  redirect("/dashboard");
}
