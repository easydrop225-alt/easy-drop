import { createClient } from "@/lib/supabase/server";
import { NouvelleCommandeForm } from "./form";
import type { Product, ProductVariant, Inventory } from "@/types/database";

export default async function NouvelleCommandePage({
  searchParams,
}: {
  searchParams: Promise<{ produit?: string }>;
}) {
  const { produit } = await searchParams;
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("actif", true)
    .order("nom");

  const productIds = (products ?? []).map((p) => p.id);
  const { data: variants } = productIds.length
    ? await supabase.from("product_variants").select("*, inventory(*)").in("product_id", productIds)
    : { data: [] as (ProductVariant & { inventory: Inventory[] })[] };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold">Nouvelle commande</h1>
      <NouvelleCommandeForm
        products={(products ?? []) as Product[]}
        variants={(variants ?? []) as (ProductVariant & { inventory: Inventory[] })[]}
        produitPreselectionne={produit}
      />
    </div>
  );
}
