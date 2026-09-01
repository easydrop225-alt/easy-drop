"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { OrderStatut } from "@/types/database";

export async function changerStatutCommande(
  orderId: string,
  statut: OrderStatut,
  motif?: string,
  dateRelance?: string
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({
      statut,
      motif_annulation: motif ?? null,
      date_relance: statut === "relance" ? (dateRelance ?? null) : null,
    })
    .eq("id", orderId);

  if (error) return { error: error.message };
  revalidatePath("/admin/commandes");
  revalidatePath(`/admin/commandes/${orderId}`);
  revalidatePath(`/commandes/${orderId}`);
  return { success: true };
}

/**
 * Action groupée : applique le même statut à plusieurs commandes en une
 * seule requête, plutôt que de forcer l'admin à les changer une par une.
 */
export async function changerStatutPlusieursCommandes(
  orderIds: string[],
  statut: OrderStatut,
  dateRelance?: string
) {
  if (orderIds.length === 0) return { error: "Aucune commande sélectionnée." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({
      statut,
      motif_annulation: null,
      date_relance: statut === "relance" ? (dateRelance ?? null) : null,
    })
    .in("id", orderIds);

  if (error) return { error: error.message };
  revalidatePath("/admin/commandes");
  for (const id of orderIds) revalidatePath(`/commandes/${id}`);
  return { success: true, nombre: orderIds.length };
}

// Demande de suppression : l'admin déclenche, le commercial doit valider.
export async function demanderSuppressionCommande(orderId: string, motif: string) {
  const supabase = await createClient();
  const { data: order } = await supabase.from("orders").select("commercial_id, numero_commande").eq("id", orderId).single();
  if (!order) return { error: "Commande introuvable." };

  const { error } = await supabase
    .from("orders")
    .update({ demande_suppression: true, demande_suppression_motif: motif || null })
    .eq("id", orderId);

  if (error) return { error: error.message };

  await supabase.from("notifications").insert({
    destinataire_id: order.commercial_id,
    type: "demande_suppression",
    titre: "Suppression demandée",
    message: `L'administration souhaite supprimer la commande ${order.numero_commande}. Merci de valider ou refuser.`,
    lien: `/commandes/${orderId}`,
  });

  revalidatePath("/admin/commandes");
  revalidatePath(`/admin/commandes/${orderId}`);
  return { success: true };
}

export async function annulerDemandeSuppression(orderId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ demande_suppression: false, demande_suppression_motif: null })
    .eq("id", orderId);
  if (error) return { error: error.message };
  revalidatePath(`/admin/commandes/${orderId}`);
  return { success: true };
}

export async function modifierFraisLivraison(orderId: string, nouveauFrais: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ frais_livraison: nouveauFrais })
    .eq("id", orderId);

  if (error) return { error: error.message };

  // Note : le bénéfice du commercial ne dépend pas du prix de la livraison
  // (Bénéfice = Prix vente - Prix fournisseur), donc aucune mise à jour de
  // la table `profits` n'est nécessaire ici. Seul le "Prix total" affiché
  // (Prix de vente + Prix de la livraison) change, automatiquement, à l'affichage.
  revalidatePath("/admin/commandes");
  revalidatePath(`/admin/commandes/${orderId}`);
  revalidatePath(`/commandes/${orderId}`);
  return { success: true };
}

export interface InfosCommandeInput {
  clientNom: string;
  clientTelephone: string;
  clientCommune: string;
  clientAdresse: string;
  itemId: string;
  quantite: number;
  prixVenteUnitaire: number;
  observation: string;
}

// L'administrateur peut modifier toutes les informations d'une commande,
// à tout moment, quel que soit son statut.
export async function modifierInfosCommandeAdmin(orderId: string, infos: InfosCommandeInput) {
  const supabase = await createClient();

  const { error: orderError } = await supabase
    .from("orders")
    .update({
      client_nom: infos.clientNom,
      client_telephone: infos.clientTelephone,
      client_commune: infos.clientCommune,
      client_adresse: infos.clientAdresse,
    })
    .eq("id", orderId);

  if (orderError) return { error: orderError.message };

  const { error: itemError } = await supabase
    .from("order_items")
    .update({
      quantite: infos.quantite,
      prix_vente_unitaire: infos.prixVenteUnitaire,
      observation: infos.observation || null,
    })
    .eq("id", infos.itemId);

  if (itemError) return { error: itemError.message };

  revalidatePath("/admin/commandes");
  revalidatePath(`/admin/commandes/${orderId}`);
  revalidatePath(`/commandes/${orderId}`);
  return { success: true };
}
