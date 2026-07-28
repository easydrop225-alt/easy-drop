"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function ajouterVariante(
  productId: string,
  couleur: string,
  taille: string,
  stockInitial: number
) {
  const supabase = await createClient();

  const { data: variant, error: variantError } = await supabase
    .from("product_variants")
    .insert({
      product_id: productId,
      couleur: couleur || null,
      taille: taille || null,
      stock: stockInitial,
    })
    .select()
    .single();

  if (variantError) return { error: variantError.message };

  const { error: inventoryError } = await supabase.from("inventory").insert({
    product_variant_id: variant.id,
    quantite_disponible: stockInitial,
    stock_total_recu: stockInitial,
    seuil_alerte: 5,
  });

  if (inventoryError) return { error: inventoryError.message };

  revalidatePath(`/admin/produits/${productId}/edit`);
  revalidatePath("/admin/stocks");
  return { success: true };
}

// Réapprovisionnement : ajoute une quantité au stock existant (stock restant
// ET stock total reçu augmentent tous les deux). C'est l'action à utiliser
// quand un nouvel arrivage de stock est ajouté à ce qui reste du précédent.
export async function reapprovisionnerStock(inventoryId: string, productId: string, quantiteAjoutee: number) {
  const supabase = await createClient();

  const { data: inventoryRow, error: fetchError } = await supabase
    .from("inventory")
    .select("product_variant_id, quantite_disponible, stock_total_recu")
    .eq("id", inventoryId)
    .single();

  if (fetchError || !inventoryRow) return { error: "Variante introuvable." };

  const nouvelleQuantite = inventoryRow.quantite_disponible + quantiteAjoutee;
  const nouveauTotalRecu = inventoryRow.stock_total_recu + quantiteAjoutee;

  const { error } = await supabase
    .from("inventory")
    .update({
      quantite_disponible: nouvelleQuantite,
      stock_total_recu: nouveauTotalRecu,
      dernier_ajout_quantite: quantiteAjoutee,
      dernier_ajout_le: new Date().toISOString(),
    })
    .eq("id", inventoryId);

  if (error) return { error: error.message };

  await supabase
    .from("product_variants")
    .update({ stock: nouvelleQuantite })
    .eq("id", inventoryRow.product_variant_id);

  revalidatePath(`/admin/produits/${productId}/edit`);
  revalidatePath("/admin/stocks");
  return { success: true };
}

// Correction manuelle directe du stock restant (ex : erreur de saisie, casse,
// inventaire physique) — ne touche pas au stock total reçu ni au stock écoulé.
export async function modifierStock(inventoryId: string, productId: string, nouvelleQuantite: number) {
  const supabase = await createClient();

  const { data: inventoryRow, error: fetchError } = await supabase
    .from("inventory")
    .select("product_variant_id")
    .eq("id", inventoryId)
    .single();

  if (fetchError || !inventoryRow) return { error: "Variante introuvable." };

  const { error } = await supabase
    .from("inventory")
    .update({ quantite_disponible: nouvelleQuantite })
    .eq("id", inventoryId);

  if (error) return { error: error.message };

  await supabase
    .from("product_variants")
    .update({ stock: nouvelleQuantite })
    .eq("id", inventoryRow.product_variant_id);

  revalidatePath(`/admin/produits/${productId}/edit`);
  revalidatePath("/admin/stocks");
  return { success: true };
}

export async function supprimerVariante(variantId: string, productId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("product_variants").delete().eq("id", variantId);
  if (error) return { error: error.message };
  revalidatePath(`/admin/produits/${productId}/edit`);
  revalidatePath("/admin/stocks");
  return { success: true };
}
