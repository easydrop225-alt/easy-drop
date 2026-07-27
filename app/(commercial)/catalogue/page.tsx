import { createClient } from "@/lib/supabase/server";
import { CategoryGrid } from "@/components/produits/category-grid";
import type { Category, Product } from "@/types/database";

export default async function CatalogueCommercialPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("*").eq("actif", true).order("ordre");
  const { data: products } = await supabase.from("products").select("id, category_id").eq("actif", true);

  const compteParCategorie = new Map<string, number>();
  for (const p of (products ?? []) as Pick<Product, "id" | "category_id">[]) {
    if (!p.category_id) continue;
    compteParCategorie.set(p.category_id, (compteParCategorie.get(p.category_id) ?? 0) + 1);
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Catalogue</h1>
      <CategoryGrid
        categories={(categories ?? []) as Category[]}
        compteParCategorie={compteParCategorie}
        hrefPrefix="/catalogue/categorie"
      />
    </div>
  );
}
