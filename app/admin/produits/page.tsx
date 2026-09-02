import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/produits/product-card";
import type { Product, Category, ProductVariant, Inventory, Media } from "@/types/database";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Produits" };

const TRENTE_JOURS_MS = 30 * 24 * 60 * 60 * 1000;

export default async function AdminProduitsPage() {
  const supabase = await createClient();
  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*").order("created_at", { ascending: false }),
    supabase.from("categories").select("*").order("ordre"),
  ]);

  const list = (products ?? []) as Product[];
  const categoryList = (categories ?? []) as Category[];
  const productIds = list.map((p) => p.id);

  // Même logique que le catalogue commercial : disponibilité déduite du
  // stock des variantes, et une photo par produit — pour afficher des
  // cartes identiques, avec les mêmes informations résumées.
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

  const parCategorie = new Map<string, Product[]>();
  const sansCategorie: Product[] = [];
  for (const p of list) {
    if (!p.category_id) { sansCategorie.push(p); continue; }
    const arr = parCategorie.get(p.category_id) ?? [];
    arr.push(p);
    parCategorie.set(p.category_id, arr);
  }

  // Les produits désactivés sont relégués en fin de chaque groupe, plutôt
  // que mélangés avec les actifs.
  function trierActifsDabord(produits: Product[]) {
    return [...produits].sort((a, b) => (a.actif === b.actif ? 0 : a.actif ? -1 : 1));
  }

  const maintenant = Date.now();

  function GrilleProduits({ produits }: { produits: Product[] }) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {trierActifsDabord(produits).map((p) => {
          const disponible = variantesParProduit.has(p.id) ? (stockParProduit.get(p.id) ?? 0) > 0 : true;
          return (
            <ProductCard
              key={p.id}
              product={p}
              prixFournisseur={p.prix_fournisseur}
              imageUrl={imageParProduit.get(p.id)}
              href={`/admin/produits/${p.id}/edit`}
              disponible={disponible}
              actif={p.actif}
              nouveau={maintenant - new Date(p.created_at).getTime() < TRENTE_JOURS_MS}
              favoris={false}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Produits</h1>
        <Link href="/admin/produits/nouveau" className="rounded-xl bg-terracotta-500 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-600">
          Nouveau produit
        </Link>
      </div>

      <div className="space-y-8">
        {categoryList
          .filter((c) => (parCategorie.get(c.id)?.length ?? 0) > 0)
          .map((cat) => (
            <div key={cat.id}>
              <h2 className="mb-3 flex items-center gap-2 font-medium">
                <span className="text-xl">{cat.icone}</span> {cat.nom}
                <span className="rounded-full bg-beige-100 px-2 py-0.5 text-xs text-ink-900/50">
                  {parCategorie.get(cat.id)?.length ?? 0} produit(s)
                </span>
              </h2>
              <GrilleProduits produits={parCategorie.get(cat.id) ?? []} />
            </div>
          ))}

        {sansCategorie.length > 0 && (
          <div>
            <h2 className="mb-3 font-medium">Sans catégorie</h2>
            <GrilleProduits produits={sansCategorie} />
          </div>
        )}

        {list.length === 0 && <p className="text-ink-900/60">Aucun produit.</p>}
      </div>
    </div>
  );
}
