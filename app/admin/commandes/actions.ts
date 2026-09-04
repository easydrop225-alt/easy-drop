"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { repartirProportionnellement } from "@/lib/calculs/repartition-proportionnelle";
import { repartirCorrectionLivraison } from "@/lib/calculs/calcul-livraison";
import type { OrderStatut } from "@/types/database";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Recale les lignes de bénéfice "en attente" d'une commande sur les
 * order_items après une modification de prix — le trigger SQL ne crée le
 * profit qu'à la création de la ligne, jamais à sa mise à jour, donc sans
 * ça "Paiements en attente" / Dashboard / Gains restent sur l'ancien
 * montant indéfiniment. Les profits déjà payés ou annulés ne sont jamais
 * retouchés (un règlement déjà effectué ne se corrige pas rétroactivement).
 */
async function resynchroniserProfitsCommande(supabase: SupabaseServerClient, orderId: string) {
  const [{ data: items }, { data: profitsEnAttente }] = await Promise.all([
    supabase.from("order_items").select("benefice_ligne").eq("order_id", orderId),
    supabase.from("profits").select("id, montant_benefice").eq("order_id", orderId).eq("statut", "en_attente").order("created_at"),
  ]);

  const profits = (profitsEnAttente ?? []) as { id: string; montant_benefice: number }[];
  if (profits.length === 0) return;

  const nouveauTotal = (items ?? []).reduce((a, i) => a + Number(i.benefice_ligne), 0);
  const ancienTotal = profits.reduce((a, p) => a + Number(p.montant_benefice), 0);
  const delta = nouveauTotal - ancienTotal;
  if (delta === 0) return;

  const ajustements = repartirProportionnellement(
    profits.map((p) => ({ id: p.id, montant: Number(p.montant_benefice) })),
    delta
  );
  for (const a of ajustements) {
    await supabase.from("profits").update({ montant_benefice: a.nouveauMontant }).eq("id", a.id);
  }
}

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
  // Un changement de statut peut faire apparaître/disparaître un bénéfice
  // des pages qui agrègent la table `profits` (livrée <-> annulée change le
  // statut du profit associé) — sans ça, ces pages restaient sur une valeur
  // périmée tant que le cache de navigation de Next.js n'expirait pas.
  revalidatePath("/admin/paiements");
  revalidatePath("/admin/dashboard");
  revalidatePath("/gains");
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
  revalidatePath("/admin/paiements");
  revalidatePath("/admin/dashboard");
  revalidatePath("/gains");
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

/**
 * Corrige les frais de livraison SANS changer le prix total de la commande
 * (déjà annoncé/payé par le client) : l'écart est absorbé par le prix de
 * vente des lignes de la commande, réparti au prorata si plusieurs produits.
 * Le bénéfice du commercial (Prix vente - Prix fournisseur) diminue ou
 * augmente automatiquement en conséquence — voir resynchroniserProfitsCommande
 * pour la répercussion sur "Paiements en attente".
 */
export async function modifierFraisLivraison(orderId: string, nouveauFrais: number) {
  const supabase = await createClient();

  const { data: order, error: lectureError } = await supabase
    .from("orders")
    .select("frais_livraison, order_items(id, quantite, prix_vente_unitaire)")
    .eq("id", orderId)
    .single();

  if (lectureError) return { error: lectureError.message };
  if (!order) return { error: "Commande introuvable." };

  const items = order.order_items as { id: string; quantite: number; prix_vente_unitaire: number }[];
  const lignes = items.map((i) => ({ quantite: i.quantite, prixVenteUnitaire: i.prix_vente_unitaire }));

  // Si le prix de la livraison augmente (ou diminue), le prix total payé
  // par le client ne doit pas bouger : la différence est compensée sur le
  // prix de vente, répartie au prorata des quantités (même logique que le
  // mode "un seul prix total" du formulaire de commande) — jamais ajoutée
  // en plus du prix déjà convenu avec le client.
  const resultat = repartirCorrectionLivraison(lignes, order.frais_livraison, nouveauFrais);
  if (!resultat) {
    return {
      error: "Cette correction ferait passer le prix de vente d'un produit sous 0 FCFA — ajuste manuellement le prix de vente d'abord.",
    };
  }

  for (const [i, item] of items.entries()) {
    const ligneResultat = resultat[i];
    if (!ligneResultat || ligneResultat.prixVenteUnitaire === lignes[i]?.prixVenteUnitaire) continue;
    const { error: itemError } = await supabase
      .from("order_items")
      .update({ prix_vente_unitaire: ligneResultat.prixVenteUnitaire })
      .eq("id", item.id);
    if (itemError) return { error: itemError.message };
  }

  const { error } = await supabase
    .from("orders")
    .update({ frais_livraison: nouveauFrais })
    .eq("id", orderId);

  if (error) return { error: error.message };

  // Note : le prix total (Prix de vente + Prix de la livraison) reste donc
  // inchangé après cette correction — seule sa répartition entre "vente" et
  // "livraison" change, ce qui répercute automatiquement le bon montant
  // sur le bénéfice du commercial (Bénéfice = Prix vente - Prix fournisseur).
  await resynchroniserProfitsCommande(supabase, orderId);

  revalidatePath("/admin/commandes");
  revalidatePath(`/admin/commandes/${orderId}`);
  revalidatePath(`/commandes/${orderId}`);
  revalidatePath("/admin/paiements");
  revalidatePath("/admin/dashboard");
  revalidatePath("/gains");
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

  await resynchroniserProfitsCommande(supabase, orderId);

  revalidatePath("/admin/commandes");
  revalidatePath(`/admin/commandes/${orderId}`);
  revalidatePath(`/commandes/${orderId}`);
  revalidatePath("/admin/paiements");
  revalidatePath("/admin/dashboard");
  revalidatePath("/gains");
  return { success: true };
}
