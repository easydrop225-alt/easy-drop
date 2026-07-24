"use server";

import { createClient } from "@/lib/supabase/server";
import { nouvelleCommandeSchema } from "@/lib/validations/schemas";
import { calculDateLivraisonPrevue } from "@/lib/calculs/calcul-livraison";
import { redirect } from "next/navigation";

export async function creerCommande(_prevState: unknown, formData: FormData) {
  const raw = {
    productId: formData.get("productId"),
    productVariantId: formData.get("productVariantId") || undefined,
    quantite: formData.get("quantite"),
    prixVenteUnitaire: formData.get("prixVenteUnitaire"),
    clientNom: formData.get("clientNom"),
    clientTelephone: formData.get("clientTelephone"),
    clientCommune: formData.get("clientCommune"),
    clientAdresse: formData.get("clientAdresse"),
    zone: formData.get("zone"),
    modeLivraison: formData.get("modeLivraison") || "normal",
    fraisLivraison: formData.get("fraisLivraison"),
  };

  const parsed = nouvelleCommandeSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée, merci de te reconnecter." };

  const { data: product } = await supabase
    .from("products")
    .select("prix_fournisseur")
    .eq("id", parsed.data.productId)
    .single();

  if (!product) return { error: "Produit introuvable." };

  const { dateLivraison } = calculDateLivraisonPrevue();

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
      statut: "nouvelle",
    })
    .select()
    .single();

  if (orderError || !order) {
    return { error: orderError?.message ?? "Erreur lors de la création de la commande." };
  }

  const { error: itemError } = await supabase.from("order_items").insert({
    order_id: order.id,
    product_id: parsed.data.productId,
    product_variant_id: parsed.data.productVariantId ?? null,
    quantite: parsed.data.quantite,
    prix_vente_unitaire: parsed.data.prixVenteUnitaire,
    prix_fournisseur_unitaire: product.prix_fournisseur,
  });

  if (itemError) {
    return { error: itemError.message };
  }

  redirect(`/commandes/${order.id}`);
}
