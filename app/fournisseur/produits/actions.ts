"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const MARGE_PLATEFORME = 1.10; // 10% de marge ajoutée automatiquement pour Easy Drop.

export interface ProduitFournisseurInput {
  nom: string;
  description?: string;
  categoryId: string | null;
  prixFournisseurBrut: number;
  prixMinConseille?: number;
  prixMaxConseille?: number;
  couleurs: string[];
  tailles: string[];
}

function genererSlug(nom: string) {
  return nom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Math.random().toString(36).slice(2, 7);
}

export async function creerProduitFournisseur(input: ProduitFournisseurInput) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: "Session expirée." };

  if (!input.nom.trim()) return { error: "Le nom du produit est requis." };
  if (!input.prixFournisseurBrut || input.prixFournisseurBrut <= 0) return { error: "Indique ton prix." };

  const { error } = await supabase.from("products").insert({
    nom: input.nom.trim(),
    slug: genererSlug(input.nom),
    description: input.description || null,
    category_id: input.categoryId,
    fournisseur_id: session.user.id,
    statut_validation: "en_attente",
    prix_fournisseur_externe_brut: input.prixFournisseurBrut,
    prix_fournisseur: Math.round(input.prixFournisseurBrut * MARGE_PLATEFORME),
    prix_min_conseille: input.prixMinConseille || null,
    prix_max_conseille: input.prixMaxConseille || null,
    couleurs: input.couleurs,
    tailles: input.tailles,
    actif: true,
  });

  if (error) return { error: error.message };

  revalidatePath("/fournisseur/produits");
  revalidatePath("/admin/produits");
  return { success: true };
}

export async function modifierProduitFournisseur(productId: string, input: ProduitFournisseurInput) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .update({
      nom: input.nom.trim(),
      description: input.description || null,
      category_id: input.categoryId,
      prix_fournisseur_externe_brut: input.prixFournisseurBrut,
      prix_fournisseur: Math.round(input.prixFournisseurBrut * MARGE_PLATEFORME),
      prix_min_conseille: input.prixMinConseille || null,
      prix_max_conseille: input.prixMaxConseille || null,
      couleurs: input.couleurs,
      tailles: input.tailles,
      // statut_validation repasse automatiquement en "en_attente" par un
      // trigger en base — inutile (et impossible, RLS l'empêcherait) de le
      // faire depuis ici.
    })
    .eq("id", productId);

  if (error) return { error: error.message };

  revalidatePath("/fournisseur/produits");
  revalidatePath(`/fournisseur/produits/${productId}/edit`);
  revalidatePath("/admin/produits");
  return { success: true };
}
