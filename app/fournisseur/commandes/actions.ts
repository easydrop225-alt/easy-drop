"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { OrderStatut } from "@/types/database";

/**
 * Change le statut complet d'une commande — n'aboutit que si la commande
 * est composée à 100% des produits de ce fournisseur (la policy RLS
 * "Fournisseur pilote le statut si commande 100% ses produits" refuse
 * silencieusement toute tentative sur une commande mixte ou qui n'est pas
 * la sienne).
 */
export async function changerStatutCommandeFournisseur(orderId: string, statut: OrderStatut) {
  const supabase = await createClient();
  const { error } = await supabase.from("orders").update({ statut }).eq("id", orderId);
  if (error) return { error: error.message };
  revalidatePath("/fournisseur/commandes");
  return { success: true };
}

/**
 * Pour une commande mixte (contient aussi des produits qui ne sont pas les
 * siens) : le fournisseur ne peut mettre à jour que la préparation de SA
 * propre ligne, jamais le statut global de la commande.
 */
export async function mettreAJourPreparationFournisseur(
  itemId: string,
  statut: "en_attente" | "pret" | "expedie"
) {
  const supabase = await createClient();
  const { error } = await supabase.from("order_items").update({ statut_preparation_fournisseur: statut }).eq("id", itemId);
  if (error) return { error: error.message };
  revalidatePath("/fournisseur/commandes");
  return { success: true };
}
