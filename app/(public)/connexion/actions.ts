"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function connecter(_prevState: unknown, formData: FormData) {
  const identifiant = String(formData.get("identifiant") ?? "");
  const motDePasse = String(formData.get("motDePasse") ?? "");

  if (!identifiant || !motDePasse) {
    return { error: "Merci de remplir tous les champs." };
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
    return { error: "Identifiants incorrects." };
  }

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

  redirect("/dashboard");
}
