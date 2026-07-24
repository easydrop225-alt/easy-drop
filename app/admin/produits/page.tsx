import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { formatFCFA } from "@/lib/utils";
import type { Product } from "@/types/database";

export default async function AdminProduitsPage() {
  const supabase = await createClient();
  const { data: products } = await supabase.from("products").select("*").order("created_at", { ascending: false });
  const list = (products ?? []) as Product[];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Produits</h1>
        <a href="/admin/produits/nouveau" className="rounded-xl bg-terracotta-500 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-600">
          Nouveau produit
        </a>
      </div>
      <Card className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-900/5 text-left text-ink-900/50">
              <th className="p-3">Référence</th>
              <th className="p-3">Nom</th>
              <th className="p-3">Prix fournisseur</th>
              <th className="p-3">Statut</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className="border-b border-ink-900/5 last:border-0">
                <td className="p-3 font-mono text-xs">{p.reference}</td>
                <td className="p-3">{p.nom}</td>
                <td className="p-3">{formatFCFA(p.prix_fournisseur)}</td>
                <td className="p-3">{p.actif ? "Actif" : "Inactif"}</td>
                <td className="p-3"><a href={`/admin/produits/${p.id}/edit`} className="text-terracotta-600 underline">Modifier</a></td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-ink-900/40">Aucun produit.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
