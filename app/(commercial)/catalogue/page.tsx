import { createClient } from "@/lib/supabase/server";
import { CategoryGrid } from "@/components/produits/category-grid";
import { CatalogueRecherche, type ProduitPourRecherche } from "@/components/produits/catalogue-recherche";
import type { Category, Product, ProductVariant, Inventory, Media } from "@/types/database";

export default async function CatalogueCommercialPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("*").eq("actif", true).order("ordre");
  const { data: products } = await supabase.from("products").select("*").eq("actif", true).order("nom");

  const list = (products ?? []) as Product[];
  const productIds = list.map((p) => p.id);

  const compteParCategorie = new Map<string, number>();
  for (const p of list) {
    if (!p.category_id) continue;
    compteParCategorie.set(p.category_id, (compteParCategorie.get(p.category_id) ?? 0) + 1);
  }

  const { data: variants } = productIds.length
    ? await supabase.from("product_variants").select("*, inventory(*)").in("product_id", productIds)
    : { data: [] as (ProductVariant & { inventory: Inventory[] })[] };

  const { data: media } = productIds.length
    ? await supabase.from("media").select("*").in("product_id", productIds).eq("type", "image").order("ordre")
    : { data: [] as Media[] };

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
    prixFournisseur: p.prix_fournisseur,
  }));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Catalogue</h1>
      <CatalogueRecherche
        produits={produitsPourRecherche}
        categories={(categories ?? []).map((c) => ({ id: c.id, nom: c.nom }))}
      />
      <div className="mt-8">
        <h2 className="mb-4 text-sm font-medium text-ink-900/50">Ou parcourir par catégorie</h2>
        <CategoryGrid
          categories={(categories ?? []) as Category[]}
          compteParCategorie={compteParCategorie}
          hrefPrefix="/catalogue/categorie"
        />
      </div>
    </div>
  );
}
