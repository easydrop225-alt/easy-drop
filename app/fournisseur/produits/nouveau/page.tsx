import { createClient } from "@/lib/supabase/server";
import { ProduitFournisseurForm } from "../produit-fournisseur-form";
import type { Category } from "@/types/database";

export default async function NouveauProduitFournisseurPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("*").order("ordre");

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-4 text-2xl font-semibold">Ajouter un produit</h1>
      <ProduitFournisseurForm categories={(categories ?? []) as Category[]} />
    </div>
  );
}
