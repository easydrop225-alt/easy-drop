import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ProduitFournisseurForm } from "../../produit-fournisseur-form";
import type { Category, Product } from "@/types/database";

export default async function EditProduitFournisseurPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: produit }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).single(),
    supabase.from("categories").select("*").order("ordre"),
  ]);

  if (!produit) notFound();

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-4 text-2xl font-semibold">Modifier {(produit as Product).nom}</h1>
      <ProduitFournisseurForm categories={(categories ?? []) as Category[]} produit={produit as Product} />
    </div>
  );
}
