import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ProduitForm } from "../../form";
import { modifierProduit } from "../../actions";
import { MediaUploader } from "@/components/produits/media-uploader";
import { VariantesManager } from "@/components/produits/variantes-manager";
import type { Category, Product, ProductVariant, Inventory } from "@/types/database";

export default async function EditProduitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase.from("products").select("*").eq("id", id).single();
  if (!product) notFound();

  const { data: categories } = await supabase.from("categories").select("*").order("ordre");
  const { data: variants } = await supabase
    .from("product_variants")
    .select("*, inventory(*)")
    .eq("product_id", id);

  const modifierCeProduit = modifierProduit.bind(null, id);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">Modifier — {(product as Product).nom}</h1>

      <ProduitForm
        categories={(categories ?? []) as Category[]}
        produit={product as Product}
        action={modifierCeProduit}
        submitLabel="Enregistrer les modifications"
      />

      <MediaUploader productId={id} />

      <VariantesManager
        productId={id}
        variants={(variants ?? []) as (ProductVariant & { inventory: Inventory[] })[]}
      />
    </div>
  );
}
