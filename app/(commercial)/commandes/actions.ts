"use server";

import { createClient } from "@/lib/supabase/server";
import { nouvelleCommandeSchema } from "@/lib/validations/schemas";
import { calculDateLivraisonPrevue } from "@/lib/calculs/calcul-livraison";
import { prixFournisseurEffectif } from "@/lib/calculs/prix-variante";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function creerCommande(_prevState: unknown, formData: FormData) {
  const raw = {
    produits: JSON.parse(String(formData.get("produitsJson") ?? "[]")),
    clientNom: formData.get("clientNom"),
    clientTelephone: formData.get("clientTelephone"),
    clientCommune: formData.get("clientCommune"),
    clientAdresse: formData.get("clientAdresse"),
    zone: formData.get("zone"),
    modeLivraison: formData.get("modeLivraison") || "normal",
    fraisLivraison: formData.get("fraisLivraison"),
    observation: formData.get("observation") || undefined,
    gare: formData.get("gare") || undefined,
    villeExpedition: formData.get("villeExpedition") || undefined,
  };

  const parsed = nouvelleCommandeSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée, merci de te reconnecter." };

  // Les prix fournisseurs sont toujours revérifiés côté serveur (jamais
  // fait confiance à ce que le navigateur a envoyé) — nécessaire pour que
  // le calcul du bénéfice soit fiable même si plusieurs produits différents
  // sont commandés en même temps.
  const productIds = parsed.data.produits.map((p) => p.productId);
  const { data: productsData } = await supabase
    .from("products")
    .select("id, prix_fournisseur")
    .in("id", productIds);

  const prixFournisseurParId = new Map((productsData ?? []).map((p) => [p.id, p.prix_fournisseur]));
  for (const p of parsed.data.produits) {
    if (!prixFournisseurParId.has(p.productId)) return { error: "Un des produits sélectionnés est introuvable." };
  }

  // Certaines variantes ont leur propre prix fournisseur (ex : une taille
  // qui coûte plus cher à produire) — prioritaire sur celui du produit.
  const variantIds = parsed.data.produits.flatMap((p) => p.lignes.map((l) => l.productVariantId)).filter((id): id is string => !!id);
  const { data: variantsData } = variantIds.length
    ? await supabase.from("product_variants").select("id, prix_fournisseur").in("id", variantIds)
    : { data: [] as { id: string; prix_fournisseur: number | null }[] };
  const prixFournisseurParVarianteId = new Map((variantsData ?? []).map((v) => [v.id, v.prix_fournisseur]));

  const { dateLivraison } = calculDateLivraisonPrevue();

  // Un seul frais de livraison pour toute la commande, quel que soit le
  // nombre de produits différents commandés (stocké une seule fois sur la
  // commande elle-même, jamais dupliqué par ligne de produit).
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      commercial_id: user.id,
      client_nom: parsed.data.clientNom,
      client_telephone: parsed.data.clientTelephone,
      client_commune: parsed.data.clientCommune,
      client_adresse: parsed.data.clientAdresse,
      zone: parsed.data.zone,
      mode_livraison: parsed.data.modeLivraison,
      frais_livraison: parsed.data.fraisLivraison,
      date_livraison_prevue: dateLivraison.toISOString().slice(0, 10),
      gare: parsed.data.gare ?? null,
      ville_expedition: parsed.data.villeExpedition ?? null,
      statut: "confirmation",
    })
    .select()
    .single();

  if (orderError || !order) {
    return { error: orderError?.message ?? "Erreur lors de la création de la commande." };
  }

  // Pour chaque produit du panier, le commercial saisit un seul prix de
  // vente pour l'ensemble de ses variantes/quantités : on répartit ce
  // montant à parts égales par pièce, produit par produit (chaque produit
  // ayant son propre prix fournisseur, la répartition doit rester séparée).
  const lignesAInserer = parsed.data.produits.flatMap((p) => {
    const quantiteProduit = p.lignes.reduce((acc, l) => acc + l.quantite, 0);
    const prixVenteUnitaire = p.prixVente / quantiteProduit;
    const prixFournisseur = prixFournisseurParId.get(p.productId)!;

    return p.lignes.map((ligne) => ({
      order_id: order.id,
      product_id: p.productId,
      product_variant_id: ligne.productVariantId,
      quantite: ligne.quantite,
      prix_vente_unitaire: prixVenteUnitaire,
      prix_fournisseur_unitaire: prixFournisseurEffectif(
        ligne.productVariantId ? prixFournisseurParVarianteId.get(ligne.productVariantId) : undefined,
        prixFournisseur
      ),
      observation: parsed.data.observation ?? null,
    }));
  });

  const { error: itemsError } = await supabase.from("order_items").insert(lignesAInserer);

  if (itemsError) {
    return { error: itemsError.message };
  }

  redirect(`/commandes/${order.id}`);
}

const STATUTS_MODIFIABLES = ["confirmation", "traitement"];

export interface InfosCommandeCommercialInput {
  clientNom: string;
  clientTelephone: string;
  clientCommune: string;
  clientAdresse: string;
  itemId: string;
  quantite: number;
  prixVenteUnitaire: number;
  observation: string;
}

// Le commercial ne peut modifier sa commande que tant qu'elle n'est pas
// encore en livraison (les policies RLS appliquent la même règle côté base
// de données, cette vérification côté serveur donne un message plus clair).
export async function modifierMaCommande(orderId: string, infos: InfosCommandeCommercialInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée, merci de te reconnecter." };

  const { data: order } = await supabase.from("orders").select("statut, commercial_id").eq("id", orderId).single();
  if (!order || order.commercial_id !== user.id) return { error: "Commande introuvable." };
  if (!STATUTS_MODIFIABLES.includes(order.statut)) {
    return { error: "Cette commande ne peut plus être modifiée (elle est déjà en cours de livraison ou au-delà)." };
  }

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

  revalidatePath(`/commandes/${orderId}`);
  return { success: true };
}

// Le commercial valide la demande de suppression émise par l'admin.
export async function validerSuppressionCommande(orderId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée." };

  const { error } = await supabase
    .from("orders")
    .delete()
    .eq("id", orderId)
    .eq("commercial_id", user.id)
    .eq("demande_suppression", true);

  if (error) return { error: error.message };
  revalidatePath("/commandes");
  return { success: true };
}

// Le commercial refuse la demande de suppression.
export async function refuserSuppressionCommande(orderId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ demande_suppression: false, demande_suppression_motif: null })
    .eq("id", orderId);
  if (error) return { error: error.message };
  revalidatePath(`/commandes/${orderId}`);
  return { success: true };
}

// Statuts pour lesquels le commercial peut encore annuler lui-même —
// c'est-à-dire avant que la commande ne soit passée en livraison.
const STATUTS_ANNULABLES_PAR_COMMERCIAL = ["confirmation", "traitement", "relance"];
const DELAI_ANNULATION_HEURES = 24;

/**
 * Permet au commercial d'annuler lui-même sa propre commande, sans passer
 * par l'admin — mais seulement dans les 24h suivant son enregistrement, et
 * seulement si elle n'est pas encore en cours de livraison (au-delà, seul
 * l'admin peut agir, la marchandise étant potentiellement déjà en route).
 */
export async function annulerCommandeParCommercial(orderId: string, motif: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée, merci de te reconnecter." };

  const { data: order } = await supabase
    .from("orders")
    .select("statut, created_at, commercial_id")
    .eq("id", orderId)
    .single();

  if (!order) return { error: "Commande introuvable." };
  if (order.commercial_id !== user.id) return { error: "Cette commande ne t'appartient pas." };

  if (!STATUTS_ANNULABLES_PAR_COMMERCIAL.includes(order.statut)) {
    return { error: "Cette commande est déjà en cours de livraison ou au-delà : seul l'administrateur peut encore l'annuler." };
  }

  const heuresEcoulees = (Date.now() - new Date(order.created_at).getTime()) / (1000 * 60 * 60);
  if (heuresEcoulees > DELAI_ANNULATION_HEURES) {
    return { error: "Le délai de 24h pour annuler toi-même cette commande est dépassé. Contacte l'administration si besoin." };
  }

  const { error } = await supabase
    .from("orders")
    .update({
      statut: "annulee",
      motif_annulation: motif.trim() || "Annulée par le commercial",
    })
    .eq("id", orderId);

  if (error) return { error: error.message };

  revalidatePath(`/commandes/${orderId}`);
  revalidatePath("/commandes");
  revalidatePath("/admin/commandes");
  return { success: true };
}
