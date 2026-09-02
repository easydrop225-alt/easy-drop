import Link from "next/link";
import type { Category } from "@/types/database";

export function CategoryRow({
  categories,
  compteParCategorie,
  hrefPrefix,
}: {
  categories: Category[];
  compteParCategorie: Map<string, number>;
  hrefPrefix: string;
}) {
  const categoriesAvecProduits = categories.filter((c) => (compteParCategorie.get(c.id) ?? 0) > 0);

  if (categoriesAvecProduits.length === 0) return null;

  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {categoriesAvecProduits.map((cat) => (
        <Link
          key={cat.id}
          href={`${hrefPrefix}/${cat.slug}`}
          className="flex w-20 shrink-0 flex-col items-center gap-1.5 rounded-2xl border border-ink-900/5 bg-surface p-3 text-center transition hover:shadow-md"
        >
          <span className="text-2xl">{cat.icone}</span>
          <span className="text-xs font-medium leading-tight">{cat.nom}</span>
        </Link>
      ))}
    </div>
  );
}
