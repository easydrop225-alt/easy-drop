import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ProductVariant, Inventory as InventoryType, Product } from "@/types/database";

type InventoryRow = InventoryType & { product_variants: (ProductVariant & { products: Product }) };

export default async function StocksPage() {
  const supabase = await createClient();
  const { data: inventory } = await supabase
    .from("inventory")
    .select("*, product_variants(*, products(*))");

  const rows = (inventory ?? []) as unknown as InventoryRow[];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Stocks</h1>
      <Card className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-900/5 text-left text-ink-900/50">
              <th className="p-3">Produit</th>
              <th className="p-3">Variante</th>
              <th className="p-3">Stock disponible</th>
              <th className="p-3">Seuil d'alerte</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-ink-900/5 last:border-0">
                <td className="p-3">{row.product_variants?.products?.nom}</td>
                <td className="p-3">{[row.product_variants?.couleur, row.product_variants?.taille].filter(Boolean).join(" / ") || "—"}</td>
                <td className={cn("p-3 font-medium", row.quantite_disponible <= row.seuil_alerte && "text-red-600")}>
                  {row.quantite_disponible}
                </td>
                <td className="p-3">{row.seuil_alerte}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-ink-900/40">Aucune donnée de stock.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
