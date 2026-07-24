import { createClient } from "@/lib/supabase/server";
import { ProduitForm } from "../form";
import type { Category } from "@/types/database";

export default async function NouveauProduitPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("*").order("ordre");
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-2 text-2xl font-semibold">Nouveau produit</h1>
      <p className="mb-6 text-sm text-ink-900/60">
        Enregistre d'abord les informations de base — tu pourras ajouter les photos, vidéos et variantes (couleur/taille) juste après.
      </p>
      <ProduitForm categories={(categories ?? []) as Category[]} />
    </div>
  );
}
