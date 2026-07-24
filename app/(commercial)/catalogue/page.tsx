import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/produits/product-card";
import type { Product } from "@/types/database";

export default async function CatalogueCommercialPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("actif", true)
    .order("created_at", { ascending: false });

  const list = (products ?? []) as Product[];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Catalogue</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            prixFournisseur={product.prix_fournisseur}
            href={`/commandes/nouvelle?produit=${product.id}`}
          />
        ))}
        {list.length === 0 && <p className="text-ink-900/60">Aucun produit disponible.</p>}
      </div>
    </div>
  );
}
