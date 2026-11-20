import type { SupabaseClient } from "@supabase/supabase-js";
import { estVarianteStandard } from "./libelle-variante";

/**
 * Fixe le stock d'un produit SANS variantes. Le stock étant suivi par
 * variante (table inventory), on crée au besoin une variante « Standard »
 * invisible (ni nom, ni couleur, ni taille) : décrément à la commande,
 * restitution à l'annulation, alerte et désactivation à zéro fonctionnent
 * alors comme pour les autres produits.
 * Une hausse du stock compte comme un arrivage (stock total reçu + dernier ajout).
 */
export async function appliquerStockProduit(
  supabase: SupabaseClient,
  productId: string,
  quantite: number
): Promise<{ error?: string; success?: boolean }> {
  if (!Number.isInteger(quantite) || quantite < 0) return { error: "Le stock doit être un nombre entier positif." };

  const { data: variants, error: lectureError } = await supabase
    .from("product_variants")
    .select("id, nom, couleur, taille, inventory(id, quantite_disponible, stock_total_recu)")
    .eq("product_id", productId);
  if (lectureError) return { error: lectureError.message };

  const liste = (variants ?? []) as {
    id: string; nom: string | null; couleur: string | null; taille: string | null;
    inventory: { id: string; quantite_disponible: number; stock_total_recu: number }[];
  }[];
  if (liste.some((v) => !estVarianteStandard(v))) {
    return { error: "Ce produit a des variantes : son stock se règle variante par variante (bloc « Variantes » plus bas)." };
  }

  const maintenant = new Date().toISOString();
  let standard = liste[0];
  if (!standard) {
    const { data: v, error } = await supabase
      .from("product_variants")
      .insert({ product_id: productId, couleur: null, taille: null, nom: null, stock: quantite })
      .select("id")
      .single();
    if (error || !v) return { error: error?.message ?? "Création du stock impossible." };
    standard = { id: v.id, nom: null, couleur: null, taille: null, inventory: [] };
  }

  const inv = standard.inventory[0];
  if (!inv) {
    const { error } = await supabase.from("inventory").insert({
      product_variant_id: standard.id,
      quantite_disponible: quantite,
      stock_total_recu: quantite,
      seuil_alerte: 5,
      dernier_ajout_quantite: quantite > 0 ? quantite : null,
      dernier_ajout_le: quantite > 0 ? maintenant : null,
    });
    if (error) return { error: error.message };
  } else {
    const ecart = quantite - inv.quantite_disponible;
    const { error } = await supabase
      .from("inventory")
      .update({
        quantite_disponible: quantite,
        ...(ecart > 0
          ? { stock_total_recu: inv.stock_total_recu + ecart, dernier_ajout_quantite: ecart, dernier_ajout_le: maintenant }
          : {}),
      })
      .eq("id", inv.id);
    if (error) return { error: error.message };
  }
  await supabase.from("product_variants").update({ stock: quantite }).eq("id", standard.id);
  return { success: true };
}
