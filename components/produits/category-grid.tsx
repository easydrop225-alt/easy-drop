import type { Category } from "@/types/database";

export function CategoryGrid({
  categories,
  compteParCategorie,
  hrefPrefix,
}: {
  categories: Category[];
  compteParCategorie: Map<string, number>;
  hrefPrefix: string;
}) {
  const categoriesAvecProduits = categories.filter((c) => (compteParCategorie.get(c.id) ?? 0) > 0);

  if (categoriesAvecProduits.length === 0) {
    return <p className="text-ink-900/60">Aucun produit disponible pour le moment.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {categoriesAvecProduits.map((cat) => (
        <a
          key={cat.id}
          href={`${hrefPrefix}/${cat.slug}`}
          className="flex flex-col items-center gap-2 rounded-2xl border border-ink-900/5 bg-white p-6 text-center transition hover:shadow-md"
        >
          <span className="text-4xl">{cat.icone}</span>
          <span className="font-medium">{cat.nom}</span>
          <span className="rounded-full bg-beige-100 px-2 py-0.5 text-xs text-ink-900/50">
            {compteParCategorie.get(cat.id)} produit(s)
          </span>
        </a>
      ))}
    </div>
  );
}
