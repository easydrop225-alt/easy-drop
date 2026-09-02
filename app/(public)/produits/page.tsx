import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CategoryGrid } from "@/components/produits/category-grid";
import type { Category, Product } from "@/types/database";

export const revalidate = 300;

export default async function CataloguePublicPage() {
  const supabase = await createClient();
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("categories").select("*").eq("actif", true).order("ordre"),
    supabase.from("products_public").select("id, category_id"),
  ]);

  const compteParCategorie = new Map<string, number>();
  for (const p of (products ?? []) as Pick<Product, "id" | "category_id">[]) {
    if (!p.category_id) continue;
    compteParCategorie.set(p.category_id, (compteParCategorie.get(p.category_id) ?? 0) + 1);
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="mb-8 text-3xl font-semibold">Notre catalogue</h1>
      <CategoryGrid
        categories={(categories ?? []) as Category[]}
        compteParCategorie={compteParCategorie}
        hrefPrefix="/produits/categorie"
      />
      <p className="mt-10 rounded-xl bg-beige-100 p-4 text-sm text-ink-900/70">
        Les prix ne sont visibles qu'après création d'un compte commercial validé.{" "}
        <Link href="/inscription" className="font-medium text-terracotta-600 underline">
          Devenir commercial
        </Link>
      </p>
    </main>
  );
}
