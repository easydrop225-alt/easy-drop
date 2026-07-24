import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/produits/product-card";
import type { Product } from "@/types/database";

export const revalidate = 300; // ISR : régénère toutes les 5 minutes

export default async function CataloguePublicPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products_public")
    .select("*")
    .order("created_at", { ascending: false });

  const list = (products ?? []) as Product[];

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="mb-8 text-3xl font-semibold">Notre catalogue</h1>
      {list.length === 0 ? (
        <p className="text-ink-900/60">Aucun produit disponible pour le moment.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              href={`/produits/${product.slug}`}
            />
          ))}
        </div>
      )}
      <p className="mt-10 rounded-xl bg-beige-100 p-4 text-sm text-ink-900/70">
        Les prix ne sont visibles qu'après création d'un compte commercial validé.{" "}
        <a href="/inscription" className="font-medium text-terracotta-600 underline">
          Devenir commercial
        </a>
      </p>
    </main>
  );
}
