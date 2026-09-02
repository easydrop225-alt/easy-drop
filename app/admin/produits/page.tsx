import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { formatFCFA } from "@/lib/utils";
import type { Product, Category } from "@/types/database";
import { SupprimerProduitButton } from "./delete-button";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Produits" };


export default async function AdminProduitsPage() {
  const supabase = await createClient();
  const { data: products } = await supabase.from("products").select("*").order("created_at", { ascending: false });
  const { data: categories } = await supabase.from("categories").select("*").order("ordre");

  const list = (products ?? []) as Product[];
  const categoryList = (categories ?? []) as Category[];

  const parCategorie = new Map<string, Product[]>();
  const sansCategorie: Product[] = [];
  for (const p of list) {
    if (!p.category_id) { sansCategorie.push(p); continue; }
    const arr = parCategorie.get(p.category_id) ?? [];
    arr.push(p);
    parCategorie.set(p.category_id, arr);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Produits</h1>
        <Link href="/admin/produits/nouveau" className="rounded-xl bg-terracotta-500 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-600">
          Nouveau produit
        </Link>
      </div>

      <div className="space-y-6">
        {categoryList
          .filter((c) => (parCategorie.get(c.id)?.length ?? 0) > 0)
          .map((cat) => (
            <div key={cat.id}>
              <h2 className="mb-2 flex items-center gap-2 font-medium">
                <span className="text-xl">{cat.icone}</span> {cat.nom}
                <span className="rounded-full bg-beige-100 px-2 py-0.5 text-xs text-ink-900/50">
                  {parCategorie.get(cat.id)?.length ?? 0} produit(s)
                </span>
              </h2>
              <Card className="p-0">
                <table className="w-full text-sm">
                  <tbody>
                    {(parCategorie.get(cat.id) ?? []).map((p) => (
                      <tr key={p.id} className="border-b border-ink-900/5 last:border-0">
                        <td className="p-3 font-mono text-xs">{p.reference}</td>
                        <td className="p-3">{p.nom}</td>
                        <td className="p-3">{formatFCFA(p.prix_fournisseur)}</td>
                        <td className="p-3">{p.actif ? "Actif" : "Inactif"}</td>
                        <td className="p-3"><Link href={`/admin/produits/${p.id}/edit`} className="text-terracotta-600 underline">Modifier</Link></td>
                        <td className="p-3"><SupprimerProduitButton productId={p.id} nomProduit={p.nom} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          ))}

        {sansCategorie.length > 0 && (
          <div>
            <h2 className="mb-2 font-medium">Sans catégorie</h2>
            <Card className="p-0">
              <table className="w-full text-sm">
                <tbody>
                  {sansCategorie.map((p) => (
                    <tr key={p.id} className="border-b border-ink-900/5 last:border-0">
                      <td className="p-3 font-mono text-xs">{p.reference}</td>
                      <td className="p-3">{p.nom}</td>
                      <td className="p-3">{formatFCFA(p.prix_fournisseur)}</td>
                      <td className="p-3">{p.actif ? "Actif" : "Inactif"}</td>
                      <td className="p-3"><Link href={`/admin/produits/${p.id}/edit`} className="text-terracotta-600 underline">Modifier</Link></td>
                      <td className="p-3"><SupprimerProduitButton productId={p.id} nomProduit={p.nom} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {list.length === 0 && <p className="text-ink-900/60">Aucun produit.</p>}
      </div>
    </div>
  );
}
