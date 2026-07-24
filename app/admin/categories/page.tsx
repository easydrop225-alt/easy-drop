import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types/database";
import { CategorieRow } from "./categorie-row";
import { NouvelleCategorieForm } from "./nouvelle-form";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("*").order("ordre");
  const list = (categories ?? []) as Category[];

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-2xl font-semibold">Catégories</h1>

      <NouvelleCategorieForm />

      <div className="mt-6 space-y-2">
        {list.map((c) => (
          <CategorieRow key={c.id} category={c} />
        ))}
        {list.length === 0 && <p className="text-ink-900/60">Aucune catégorie pour l'instant.</p>}
      </div>
    </div>
  );
}
