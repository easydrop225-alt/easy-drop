import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/produits/product-card";
import { notFound } from "next/navigation";
import type { Product, Media, Category, ProductVariant, Inventory } from "@/types/database";

export default async function CatalogueCategoriePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: category } = await supabase.from("categories").select("*").eq("slug", slug).single();
  if (!category) notFound();

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("actif", true)
    .eq("category_id", (category as Category).id)
    .order("created_at", { ascending: false });

  const list = (products ?? []) as Product[];
  const ids = list.map((p) => p.id);

  const [{ data: media }, { data: variants }] = await Promise.all([
    ids.length
      ? supabase.from("media").select("*").in("product_id", ids).eq("type", "image").order("ordre")
      : Promise.resolve({ data: [] as Media[] }),
    ids.length
      ? supabase.from("product_variants").select("*, inventory(quantite_disponible)").in("product_id", ids)
      : Promise.resolve({ data: [] as (ProductVariant & { inventory: Inventory[] })[] }),
  ]);

  const imageParProduit = new Map<string, string>();
  for (const m of (media ?? []) as Media[]) {
    if (!imageParProduit.has(m.product_id)) imageParProduit.set(m.product_id, m.url);
  }

  // Un produit reste affiché dans le catalogue même sans stock — seule son
  // apparence change (grisé + mention "Non disponible"), il ne disparaît
  // jamais silencieusement de la liste.
  const stockParProduit = new Map<string, number>();
  const nbVariantesParProduit = new Map<string, number>();
  for (const v of (variants ?? []) as (ProductVariant & { inventory: Inventory[] })[]) {
    nbVariantesParProduit.set(v.product_id, (nbVariantesParProduit.get(v.product_id) ?? 0) + 1);
    const stock = v.inventory?.[0]?.quantite_disponible ?? 0;
    stockParProduit.set(v.product_id, (stockParProduit.get(v.product_id) ?? 0) + stock);
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <a href="/catalogue" className="text-sm text-ink-900/50 hover:underline">Catalogue</a>
        <span className="text-ink-900/30">/</span>
        <h1 className="text-2xl font-semibold">{(category as Category).icone} {(category as Category).nom}</h1>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((product) => {
          const disponible = nbVariantesParProduit.has(product.id)
            ? (stockParProduit.get(product.id) ?? 0) > 0
            : true;
          return (
            <ProductCard
              key={product.id}
              product={product}
              prixFournisseur={product.prix_fournisseur}
              imageUrl={imageParProduit.get(product.id)}
              href={`/catalogue/${product.id}`}
              disponible={disponible}
            />
          );
        })}
        {list.length === 0 && <p className="text-ink-900/60">Aucun produit dans cette catégorie.</p>}
      </div>
    </div>
  );
}
