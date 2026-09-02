import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/produits/product-card";
import { notFound } from "next/navigation";
import type { Product, Media, Category } from "@/types/database";

export const revalidate = 300;

export default async function CategoriePubliquePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: category } = await supabase.from("categories").select("*").eq("slug", slug).single();
  if (!category) notFound();

  const { data: products } = await supabase
    .from("products_public")
    .select("*")
    .eq("category_id", (category as Category).id)
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
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-6 flex items-center gap-2">
        <Link href="/produits" className="text-sm text-ink-900/50 hover:underline">Catalogue</Link>
        <span className="text-ink-900/30">/</span>
        <h1 className="text-2xl font-semibold">{(category as Category).icone} {(category as Category).nom}</h1>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((product) => (
          <ProductCard key={product.id} product={product} imageUrl={imageParProduit.get(product.id)} href={`/produits/${product.slug}`} favoris={false} />
        ))}
        {list.length === 0 && <p className="text-ink-900/60">Aucun produit dans cette catégorie.</p>}
      </div>
    </main>
  );
}
