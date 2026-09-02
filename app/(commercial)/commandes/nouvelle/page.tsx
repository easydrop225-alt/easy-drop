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

  // Les 3 requêtes ci-dessous dépendent seulement de la liste de produits
  // déjà connue, pas les unes des autres — on les lance en parallèle.
  const [{ data: variants }, { data: mediaVariantes }, { data: mediaProduits }] = productIds.length
    ? await Promise.all([
        supabase.from("product_variants").select("*, inventory(*)").in("product_id", productIds),
        // Une photo par variante (quand elle existe) pour aider à distinguer
        // visuellement les couleurs/tailles pendant la sélection.
        supabase
          .from("media")
          .select("product_variant_id, url")
          .in("product_id", productIds)
          .eq("type", "image")
          .not("product_variant_id", "is", null)
          .order("ordre"),
        // Une photo générale par produit, utilisée dans le récapitulatif du
        // panier quand aucune variante précise n'a de photo dédiée.
        supabase.from("media").select("product_id, url").in("product_id", productIds).eq("type", "image").order("ordre"),
      ])
    : [
        { data: [] as (ProductVariant & { inventory: Inventory[] })[] },
        { data: [] as Pick<Media, "product_variant_id" | "url">[] },
        { data: [] as Pick<Media, "product_id" | "url">[] },
      ];

  const imageParVariante: Record<string, string> = {};
  for (const m of mediaVariantes ?? []) {
    if (m.product_variant_id && !imageParVariante[m.product_variant_id]) {
      imageParVariante[m.product_variant_id] = m.url;
    }
  }

  const imageParProduit: Record<string, string> = {};
  for (const m of mediaProduits ?? []) {
    if (!imageParProduit[m.product_id]) imageParProduit[m.product_id] = m.url;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold">Nouvelle commande</h1>
      <NouvelleCommandeForm
        products={(products ?? []) as Product[]}
        variants={(variants ?? []) as (ProductVariant & { inventory: Inventory[] })[]}
        produitPreselectionne={produit}
        imageParVariante={imageParVariante}
        imageParProduit={imageParProduit}
      />
    </div>
  );
}
