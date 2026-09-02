import { createClient } from "@/lib/supabase/server";
import { CatalogueRecherche, type ProduitPourRecherche } from "@/components/produits/catalogue-recherche";
import type { Product, ProductVariant, Inventory, Media } from "@/types/database";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Catalogue" };


const TRENTE_JOURS_MS = 30 * 24 * 60 * 60 * 1000;

export default async function CatalogueCommercialPage() {
  const supabase = await createClient();

  // categories et products sont indépendants l'un de l'autre : on les
  // lance en parallèle plutôt que l'un après l'autre (l'ancienne version
  // enchaînait 4 requêtes à la suite, ajoutant jusqu'à 3 allers-retours
  // réseau inutiles à chaque ouverture de cette page).
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("categories").select("*").eq("actif", true).order("ordre"),
    // On récupère TOUS les produits, actifs ou non : les produits désactivés
    // par l'admin restent visibles (juste leur photo, grisée), plutôt que de
    // disparaître silencieusement du catalogue.
    supabase.from("products").select("*").order("nom"),
  ]);

  const list = (products ?? []) as Product[];
  const productIds = list.map((p) => p.id);

  // variants et media dépendent tous les deux de productIds, mais pas l'un
  // de l'autre : parallélisables entre eux également.
  const [{ data: variants }, { data: media }] = await Promise.all([
    productIds.length
      ? supabase.from("product_variants").select("*, inventory(*)").in("product_id", productIds)
      : Promise.resolve({ data: [] as (ProductVariant & { inventory: Inventory[] })[] }),
    productIds.length
      ? supabase.from("media").select("*").in("product_id", productIds).eq("type", "image").order("ordre")
      : Promise.resolve({ data: [] as Media[] }),
  ]);

  const stockParProduit = new Map<string, number>();
  const variantesParProduit = new Map<string, number>();
  for (const v of (variants ?? []) as (ProductVariant & { inventory: Inventory[] })[]) {
    variantesParProduit.set(v.product_id, (variantesParProduit.get(v.product_id) ?? 0) + 1);
    const stock = v.inventory?.[0]?.quantite_disponible ?? 0;
    stockParProduit.set(v.product_id, (stockParProduit.get(v.product_id) ?? 0) + stock);
  }

  const imageParProduit = new Map<string, string>();
  for (const m of (media ?? []) as Media[]) {
    if (!imageParProduit.has(m.product_id)) imageParProduit.set(m.product_id, m.url);
  }

  const categoryById = new Map((categories ?? []).map((c) => [c.id, c] as const));
  const maintenant = Date.now();

  const produitsPourRecherche: ProduitPourRecherche[] = list.map((p) => ({
    id: p.id,
    nom: p.nom,
    slug: p.slug,
    categoryId: p.category_id,
    categoryNom: p.category_id ? (categoryById.get(p.category_id)?.nom ?? null) : null,
    prixMinConseille: p.prix_min_conseille,
    prixMaxConseille: p.prix_max_conseille,
    imageUrl: imageParProduit.get(p.id),
    disponible: variantesParProduit.has(p.id) ? (stockParProduit.get(p.id) ?? 0) > 0 : true,
    actif: p.actif,
    nouveau: maintenant - new Date(p.created_at).getTime() < TRENTE_JOURS_MS,
    prixFournisseur: p.prix_fournisseur,
    couleurs: p.couleurs,
    tailles: p.tailles,
  }));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Catalogue</h1>
      <CatalogueRecherche
        produits={produitsPourRecherche}
        categories={(categories ?? []).map((c) => ({ id: c.id, nom: c.nom }))}
      />
    </div>
  );
}
