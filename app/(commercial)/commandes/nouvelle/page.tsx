import { createClient } from "@/lib/supabase/server";
import { NouvelleCommandeForm } from "./form";
import type { Product } from "@/types/database";

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

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold">Nouvelle commande</h1>
      <NouvelleCommandeForm products={(products ?? []) as Product[]} produitPreselectionne={produit} />
    </div>
  );
}
