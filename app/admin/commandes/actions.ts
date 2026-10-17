"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { repartirProportionnellement } from "@/lib/calculs/repartition-proportionnelle";
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

/**
 * Permet à l'admin de corriger le produit d'une ligne de commande après
 * coup (ex : le commercial s'est trompé de produit à l'enregistrement) —
 * sans avoir à supprimer/recréer toute la commande. Met à jour le prix
 * fournisseur (donc le bénéfice, automatiquement via le trigger SQL) et
 * corrige le stock : restitue celui de l'ancien produit/variante, déduit
 * celui du nouveau — sauf si la commande est déjà annulée (le stock a déjà
 * été traité par ailleurs dans ce cas).
 */
export async function changerProduitCommande(
  itemId: string,
  nouveauProductId: string,
  nouveauVariantId: string | null
) {
  const supabase = await createClient();

  const { data: item, error: itemLectureError } = await supabase
    .from("order_items")
    .select("order_id, product_variant_id, quantite, orders(statut)")
    .eq("id", itemId)
    .single();

  if (itemLectureError || !item) return { error: "Ligne de commande introuvable." };

  const ancienVariantId = item.product_variant_id;
  const commandeAnnulee = (item.orders as unknown as { statut: string } | null)?.statut === "annulee";

  if (ancienVariantId === nouveauVariantId) {
    // Même variante (ou aucune variante des deux côtés) : rien à toucher
    // côté stock, juste le produit/prix à corriger le cas échéant.
  } else if (!commandeAnnulee && nouveauVariantId) {
    // Vérifie le stock disponible AVANT de toucher à quoi que ce soit —
    // en cas de stock insuffisant, on annule proprement sans rien changer.
    const { data: inv } = await supabase
      .from("inventory")
      .select("quantite_disponible")
      .eq("product_variant_id", nouveauVariantId)
      .single();
    if (!inv || inv.quantite_disponible < item.quantite) {
      return { error: `Stock insuffisant pour cette variante (${inv?.quantite_disponible ?? 0} disponible(s), ${item.quantite} nécessaire(s)).` };
    }
  }

  // Nouveau prix fournisseur : celui de la variante si elle en a un propre,
  // sinon celui du produit — même règle que partout ailleurs dans l'app.
  const { data: nouveauProduit } = await supabase.from("products").select("prix_fournisseur").eq("id", nouveauProductId).single();
  if (!nouveauProduit) return { error: "Produit introuvable." };

  let prixFournisseurUnitaire = nouveauProduit.prix_fournisseur;
  if (nouveauVariantId) {
    const { data: variante } = await supabase.from("product_variants").select("prix_fournisseur").eq("id", nouveauVariantId).single();
    if (variante?.prix_fournisseur != null) prixFournisseurUnitaire = variante.prix_fournisseur;
  }

  const { error: updateError } = await supabase
    .from("order_items")
    .update({
      product_id: nouveauProductId,
      product_variant_id: nouveauVariantId,
      prix_fournisseur_unitaire: prixFournisseurUnitaire,
    })
    .eq("id", itemId);

  if (updateError) return { error: updateError.message };

  // Ajuste le stock uniquement si la variante a réellement changé, et que
  // la commande n'est pas annulée (stock déjà neutre dans ce cas).
  if (!commandeAnnulee && ancienVariantId !== nouveauVariantId) {
    if (ancienVariantId) {
      const { data: ancienInv } = await supabase.from("inventory").select("id, quantite_disponible, stock_ecoule").eq("product_variant_id", ancienVariantId).single();
      if (ancienInv) {
        await supabase.from("inventory").update({
          quantite_disponible: ancienInv.quantite_disponible + item.quantite,
          stock_ecoule: Math.max(ancienInv.stock_ecoule - item.quantite, 0),
        }).eq("id", ancienInv.id);
      }
    }
    if (nouveauVariantId) {
      const { data: nouvelInv } = await supabase.from("inventory").select("id, quantite_disponible, stock_ecoule").eq("product_variant_id", nouveauVariantId).single();
      if (nouvelInv) {
        await supabase.from("inventory").update({
          quantite_disponible: Math.max(nouvelInv.quantite_disponible - item.quantite, 0),
          stock_ecoule: nouvelInv.stock_ecoule + item.quantite,
        }).eq("id", nouvelInv.id);
      }
    }
  }

  await resynchroniserProfitsCommande(supabase, item.order_id);

  revalidatePath("/admin/commandes");
  revalidatePath(`/admin/commandes/${item.order_id}`);
  revalidatePath(`/commandes/${item.order_id}`);
  revalidatePath("/admin/stocks");
  revalidatePath("/admin/paiements");
  return { success: true };
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
 * Impression du bon = le colis part : la commande passe tout de suite
 * « En cours de livraison » (depuis confirmation, traitement ou relance).
 * Pour une relance, la date de relance devient la date de livraison prévue,
 * pour qu'elle reste juste sur le bon et dans les listes.
 */
export async function marquerBonImprime(orderId: string) {
  const supabase = await createClient();
  const { data: o, error: e1 } = await supabase
    .from("orders")
    .select("statut, date_relance")
    .eq("id", orderId)
    .single();
  if (e1 || !o) return { error: e1?.message ?? "Commande introuvable." };
  if (!["confirmation", "traitement", "relance"].includes(o.statut)) return { success: true, inchange: true };

  const maj: Record<string, unknown> = { statut: "livraison", motif_annulation: null, date_relance: null };
  if (o.statut === "relance" && o.date_relance) maj.date_livraison_prevue = o.date_relance;
  const { error } = await supabase.from("orders").update(maj).eq("id", orderId);
  if (error) return { error: error.message };

  revalidatePath("/admin/commandes");
  revalidatePath(`/admin/commandes/${orderId}`);
  revalidatePath(`/commandes/${orderId}`);
  revalidatePath("/admin/dashboard");
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

export interface InfosCommandeInput {
  clientNom: string;
  clientTelephone: string;
  clientCommune: string;
  clientAdresse: string;
  itemId: string;
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
    .update({ observation: infos.observation || null })
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

export interface PrixCommandeAdminInput {
  fraisLivraison: number;
  lignes: { itemId: string; quantite: number; prixVenteUnitaire: number }[];
  /** Produits retirés de la commande (ex : le client n'en a pris qu'une partie). */
  lignesSupprimees?: string[];
}

/**
 * L'admin recale les prix d'une commande à tout moment, quel que soit son
 * statut (ex : le client a commandé 3 produits et n'en a pris que 2 à la
 * livraison) : prix de la livraison, quantités et prix de vente de chaque
 * ligne. Le prix total = somme des lignes + livraison. Le bénéfice suit
 * automatiquement (colonne calculée + trigger sur profits). Une quantité
 * modifiée corrige aussi le stock de la variante, sauf commande annulée
 * (son stock a déjà été restitué).
 */
export async function modifierPrixCommandeAdmin(orderId: string, input: PrixCommandeAdminInput) {
  if (!Number.isFinite(input.fraisLivraison) || input.fraisLivraison < 0) return { error: "Prix de la livraison invalide." };
  if (input.lignes.some((l) => !Number.isInteger(l.quantite) || l.quantite < 1 || !Number.isFinite(l.prixVenteUnitaire) || l.prixVenteUnitaire < 0)) {
    return { error: "Chaque produit doit avoir une quantité d'au moins 1 et un prix de vente positif." };
  }

  const supabase = await createClient();
  const { data: order, error: lectureError } = await supabase
    .from("orders")
    .select("statut, order_items(id, quantite, prix_vente_unitaire, product_variant_id)")
    .eq("id", orderId)
    .single();
  if (lectureError || !order) return { error: lectureError?.message ?? "Commande introuvable." };

  const actuels = order.order_items as { id: string; quantite: number; prix_vente_unitaire: number; product_variant_id: string | null }[];

  // --- Produits retirés de la commande
  const aSupprimer = actuels.filter((a) => (input.lignesSupprimees ?? []).includes(a.id));
  if (aSupprimer.length > 0) {
    if (actuels.length - aSupprimer.length < 1) return { error: "Une commande doit garder au moins un produit." };

    // Suppression réservée à l'admin : vérifiée ici, puis faite avec le client
    // service role (aucune policy RLS ne permet de supprimer une ligne de commande).
    const { data: { user } } = await supabase.auth.getUser();
    const { data: moi } = user ? await supabase.from("profiles").select("role").eq("id", user.id).single() : { data: null };
    if (moi?.role !== "admin" && moi?.role !== "super_admin") return { error: "Action réservée à l'administrateur." };

    const { data: payes } = await supabase
      .from("profits")
      .select("order_item_id")
      .in("order_item_id", aSupprimer.map((a) => a.id))
      .eq("statut", "paye");
    if ((payes ?? []).length > 0) {
      return { error: "Un des produits à retirer a déjà été payé au commercial : impossible de le supprimer." };
    }

    const admin = createAdminClient();
    for (const ligne of aSupprimer) {
      if (ligne.product_variant_id && order.statut !== "annulee") {
        const { data: inv } = await admin
          .from("inventory")
          .select("id, quantite_disponible, stock_ecoule")
          .eq("product_variant_id", ligne.product_variant_id)
          .single();
        if (inv) {
          await admin.from("inventory").update({
            quantite_disponible: inv.quantite_disponible + ligne.quantite,
            stock_ecoule: Math.max(inv.stock_ecoule - ligne.quantite, 0),
          }).eq("id", inv.id);
        }
      }
      // le bénéfice en attente de cette ligne part avec elle (clé étrangère en cascade)
      const { error: delError } = await admin.from("order_items").delete().eq("id", ligne.id);
      if (delError) return { error: delError.message };
    }
  }

  for (const ligne of input.lignes) {
    const actuel = actuels.find((a) => a.id === ligne.itemId);
    if (!actuel) return { error: "Un produit de la commande est introuvable — recharge la page." };
    if (actuel.quantite === ligne.quantite && Number(actuel.prix_vente_unitaire) === ligne.prixVenteUnitaire) continue;

    const { error: itemError } = await supabase
      .from("order_items")
      .update({ quantite: ligne.quantite, prix_vente_unitaire: ligne.prixVenteUnitaire })
      .eq("id", ligne.itemId);
    if (itemError) return { error: itemError.message };

    const ecart = ligne.quantite - actuel.quantite;
    if (ecart !== 0 && actuel.product_variant_id && order.statut !== "annulee") {
      const { data: inv } = await supabase
        .from("inventory")
        .select("id, quantite_disponible, stock_ecoule")
        .eq("product_variant_id", actuel.product_variant_id)
        .single();
      if (inv) {
        await supabase.from("inventory").update({
          quantite_disponible: Math.max(inv.quantite_disponible - ecart, 0),
          stock_ecoule: Math.max(inv.stock_ecoule + ecart, 0),
        }).eq("id", inv.id);
      }
    }
  }

  const { error } = await supabase.from("orders").update({ frais_livraison: input.fraisLivraison }).eq("id", orderId);
  if (error) return { error: error.message };

  await resynchroniserProfitsCommande(supabase, orderId);

  revalidatePath("/admin/commandes");
  revalidatePath(`/admin/commandes/${orderId}`);
  revalidatePath(`/commandes/${orderId}`);
  revalidatePath("/admin/paiements");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/stocks");
  revalidatePath("/gains");
  return { success: true };
}
