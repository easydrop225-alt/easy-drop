"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function ajouterLivreur(nom: string, telephone: string) {
  if (!nom.trim()) return { error: "Le nom du livreur est requis." };
  const supabase = await createClient();
  const { error } = await supabase.from("livreurs").insert({ nom: nom.trim(), telephone: telephone.trim() || null });
  if (error) return { error: error.message };
  revalidatePath("/admin/parametres");
  revalidatePath("/admin/commandes");
  return { success: true };
}

export async function retirerLivreur(id: string) {
  const supabase = await createClient();
  // On désactive plutôt que supprimer : garde l'historique des commandes
  // déjà assignées à ce livreur lisible (son nom reste affiché dessus).
  const { error } = await supabase.from("livreurs").update({ actif: false }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/parametres");
  revalidatePath("/admin/commandes");
  return { success: true };
}

export async function assignerLivreur(orderId: string, livreurId: string | null) {
  const supabase = await createClient();
  const { error } = await supabase.from("orders").update({ livreur_id: livreurId }).eq("id", orderId);
  if (error) return { error: error.message };
  revalidatePath("/admin/commandes");
  return { success: true };
}
