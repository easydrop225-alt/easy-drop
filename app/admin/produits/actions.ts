"use server";

import { createClient } from "@/lib/supabase/server";
import { produitSchema } from "@/lib/validations/schemas";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

function slugify(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function parseProduitForm(formData: FormData) {
  const raw = {
    nom: formData.get("nom"),
    categoryId: formData.get("categoryId") || null,
    description: formData.get("description") || "",
    prixFournisseur: formData.get("prixFournisseur"),
    prixMinConseille: formData.get("prixMinConseille") || undefined,
    prixMaxConseille: formData.get("prixMaxConseille") || undefined,
    couleurs: String(formData.get("couleurs") ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    tailles: String(formData.get("tailles") ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    actif: formData.get("actif") === "on",
  };
  return produitSchema.safeParse(raw);
}

export async function creerProduit(_prevState: unknown, formData: FormData) {
  const parsed = parseProduitForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("products").insert({
    nom: parsed.data.nom,
    slug: slugify(parsed.data.nom) + "-" + Date.now().toString(36),
    category_id: parsed.data.categoryId,
    description: parsed.data.description,
    prix_fournisseur: parsed.data.prixFournisseur,
    prix_min_conseille: parsed.data.prixMinConseille ?? null,
    prix_max_conseille: parsed.data.prixMaxConseille ?? null,
    couleurs: parsed.data.couleurs,
    tailles: parsed.data.tailles,
    actif: parsed.data.actif,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/produits");
  redirect("/admin/produits");
}

export async function modifierProduit(productId: string, _prevState: unknown, formData: FormData) {
  const parsed = parseProduitForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({
      nom: parsed.data.nom,
      category_id: parsed.data.categoryId,
      description: parsed.data.description,
      prix_fournisseur: parsed.data.prixFournisseur,
      prix_min_conseille: parsed.data.prixMinConseille ?? null,
      prix_max_conseille: parsed.data.prixMaxConseille ?? null,
      couleurs: parsed.data.couleurs,
      tailles: parsed.data.tailles,
      actif: parsed.data.actif,
    })
    .eq("id", productId);

  if (error) return { error: error.message };

  revalidatePath("/admin/produits");
  redirect("/admin/produits");
}
