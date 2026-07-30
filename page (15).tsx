import { createClient } from "@/lib/supabase/server";
import type { Category, Product } from "@/types/database";
import { CategorieRow } from "./categorie-row";
import { NouvelleCategorieForm } from "./nouvelle-form";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("*").order("ordre");
  const { data: products } = await supabase.from("products").select("id, category_id");
  const list = (categories ?? []) as Category[];
  const productList = (products ?? []) as Pick<Product, "id" | "category_id">[];

  const compteParCategorie = new Map<string, number>();
  for (const p of productList) {
    if (!p.category_id) continue;
    compteParCategorie.set(p.category_id, (compteParCategorie.get(p.category_id) ?? 0) + 1);
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-2xl font-semibold">Catégories</h1>

      <NouvelleCategorieForm />

      <div className="mt-6 space-y-2">
        {list.map((c) => (
          <CategorieRow key={c.id} category={c} nombreProduits={compteParCategorie.get(c.id) ?? 0} />
        ))}
        {list.length === 0 && <p className="text-ink-900/60">Aucune catégorie pour l'instant.</p>}
      </div>
    </div>
  );
}
