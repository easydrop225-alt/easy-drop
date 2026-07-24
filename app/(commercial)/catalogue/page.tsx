import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/produits/product-card";
import type { Product, Media } from "@/types/database";

export default async function CatalogueCommercialPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("actif", true)
    .order("created_at", { ascending: false });

  const list = (products ?? []) as Product[];
  const ids = list.map((p) => p.id);

  const { data: media } = ids.length
    ? await supabase.from("media").select("*").in("product_id", ids).eq("type", "image").order("ordre")
    : { data: [] as Media[] };

  const imageParProduit = new Map<string, string>();
  for (const m of (media ?? []) as Media[]) {
    if (!imageParProduit.has(m.product_id)) imageParProduit.set(m.product_id, m.url);
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Catalogue</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            prixFournisseur={product.prix_fournisseur}
            imageUrl={imageParProduit.get(product.id)}
            href={`/catalogue/${product.id}`}
          />
        ))}
        {list.length === 0 && <p className="text-ink-900/60">Aucun produit disponible.</p>}
      </div>
    </div>
  );
}
