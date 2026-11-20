import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { libelleVariante, estVarianteStandard } from "@/lib/produits/libelle-variante";
import { DefinirStockInline } from "@/components/produits/definir-stock-inline";
import { AjouterStockInline } from "@/components/produits/ajouter-stock-inline";
import type { ProductVariant, Inventory as InventoryType, Product } from "@/types/database";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Stocks" };


type InventoryRow = InventoryType & { product_variants: (ProductVariant & { products: Product }) };

export default async function StocksPage() {
  const supabase = await createClient();
  const [{ data: inventory }, { data: produits }] = await Promise.all([
    supabase.from("inventory").select("*, product_variants(*, products(*))"),
    supabase.from("products").select("id, nom, actif").order("nom"),
  ]);

  // Trié par produit puis par variante, pour retrouver d'un coup d'œil
  // toutes les variantes d'un même produit regroupées.
  const rows = ((inventory ?? []) as unknown as InventoryRow[]).sort((a, b) =>
    (a.product_variants?.products?.nom ?? "").localeCompare(b.product_variants?.products?.nom ?? "", "fr") ||
    libelleVariante(a.product_variants ?? {}).localeCompare(libelleVariante(b.product_variants ?? {}), "fr"),
  );

  // Produits dont le stock n'est pas encore suivi (aucune ligne de stock) :
  // listés aussi, pour pouvoir renseigner leur stock d'ici.
  const suivis = new Set(rows.map((r) => r.product_variants?.products?.id));
  const nonSuivis = ((produits ?? []) as Pick<Product, "id" | "nom" | "actif">[]).filter((p) => !suivis.has(p.id));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Stocks</h1>
        <p className="text-xs text-ink-900/50">
          Ajoute directement du stock ci-dessous, ou ouvre le produit dans "Produits" pour corriger une valeur.
        </p>
      </div>
      <Card className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-900/5 text-left text-ink-900/50">
              <th className="p-3">Produit</th>
              <th className="p-3">Variante</th>
              <th className="p-3">Stock restant</th>
              <th className="p-3">Stock écoulé</th>
              <th className="p-3">Stock Ajouté</th>
              <th className="p-3">Total reçu</th>
              <th className="p-3">Seuil d'alerte</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-ink-900/5 last:border-0">
                <td className="p-3">
                  <Link href={`/admin/produits/${row.product_variants?.products?.id}/edit`} className="hover:underline">
                    {row.product_variants?.products?.nom}
                  </Link>
                </td>
                <td className="p-3">
                  {row.product_variants && !estVarianteStandard(row.product_variants) ? (
                    <span className="inline-block rounded-full bg-beige-100 px-2.5 py-0.5 font-medium">{libelleVariante(row.product_variants)}</span>
                  ) : "—"}
                </td>
                <td className={cn("p-3 font-medium", row.quantite_disponible <= row.seuil_alerte && "text-red-600")}>
                  {row.quantite_disponible}
                </td>
                <td className="p-3 text-ink-900/60">{row.stock_ecoule}</td>
                <td className="p-3">
                  <AjouterStockInline
                    inventoryId={row.id}
                    productId={row.product_variants?.products?.id}
                    dernierAjoutQuantite={row.dernier_ajout_quantite}
                    dernierAjoutLe={row.dernier_ajout_le}
                  />
                </td>
                <td className="p-3 text-ink-900/60">{row.stock_total_recu}</td>
                <td className="p-3">{row.seuil_alerte}</td>
              </tr>
            ))}
            {nonSuivis.map((p) => (
              <tr key={p.id} className="border-b border-ink-900/5 bg-amber-50/40 last:border-0">
                <td className="p-3">
                  <Link href={`/admin/produits/${p.id}/edit`} className="hover:underline">{p.nom}</Link>
                  {!p.actif && <span className="ml-2 rounded-full bg-ink-900/10 px-2 py-0.5 text-[10px] font-medium uppercase">Désactivé</span>}
                </td>
                <td className="p-3 text-ink-900/40">—</td>
                <td className="p-3 text-xs text-amber-700" colSpan={2}>Stock non suivi</td>
                <td className="p-3" colSpan={3}><DefinirStockInline productId={p.id} /></td>
              </tr>
            ))}
            {rows.length === 0 && nonSuivis.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-ink-900/40">Aucune donnée de stock.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
