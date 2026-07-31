import { createClient } from "@/lib/supabase/server";
import { NouvelleCommandeForm } from "./form";
import type { Product, ProductVariant, Inventory, Media } from "@/types/database";

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

  // Une photo par variante (quand elle existe) pour aider à distinguer
  // visuellement les couleurs/tailles pendant la sélection.
  const { data: mediaVariantes } = productIds.length
    ? await supabase
        .from("media")
        .select("product_variant_id, url")
        .in("product_id", productIds)
        .eq("type", "image")
        .not("product_variant_id", "is", null)
        .order("ordre")
    : { data: [] as Pick<Media, "product_variant_id" | "url">[] };

  const imageParVariante: Record<string, string> = {};
  for (const m of mediaVariantes ?? []) {
    if (m.product_variant_id && !imageParVariante[m.product_variant_id]) {
      imageParVariante[m.product_variant_id] = m.url;
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold">Nouvelle commande</h1>
      <NouvelleCommandeForm
        products={(products ?? []) as Product[]}
        variants={(variants ?? []) as (ProductVariant & { inventory: Inventory[] })[]}
        produitPreselectionne={produit}
        imageParVariante={imageParVariante}
      />
    </div>
  );
}
