import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ProduitForm } from "../../form";
import { modifierProduit } from "../../actions";
import { MediaUploader } from "@/components/produits/media-uploader";
import { VariantesManager } from "@/components/produits/variantes-manager";
import { HistoriquePrix } from "@/components/produits/historique-prix";
import type { Category, Product, ProductVariant, Inventory, ProductPriceHistory, Profile } from "@/types/database";

export default async function EditProduitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: product }, { data: categories }, { data: variants }, { data: historique }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).single(),
    supabase.from("categories").select("*").order("ordre"),
    supabase.from("product_variants").select("*, inventory(*)").eq("product_id", id),
    supabase
      .from("product_price_history")
      .select("*, profiles(prenom, nom)")
      .eq("product_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!product) notFound();

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
        prixFournisseurProduit={(product as Product).prix_fournisseur}
      />

      <HistoriquePrix
        historique={(historique ?? []) as (ProductPriceHistory & { profiles: Pick<Profile, "prenom" | "nom"> | null })[]}
        variants={(variants ?? []) as ProductVariant[]}
      />
    </div>
  );
}
