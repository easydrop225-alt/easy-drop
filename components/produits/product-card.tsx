import { formatFCFA } from "@/lib/utils";
import type { Product } from "@/types/database";

interface ProductCardProps {
  product: Pick<Product, "id" | "nom" | "slug" | "prix_min_conseille" | "prix_max_conseille">;
  imageUrl?: string;
  prixFournisseur?: number; // affiché uniquement côté commercial
  href: string;
}

export function ProductCard({ product, imageUrl, prixFournisseur, href }: ProductCardProps) {
  return (
    <a
      href={href}
      className="group block overflow-hidden rounded-2xl border border-ink-900/5 bg-white transition hover:shadow-md"
    >
      <div className="aspect-square w-full bg-beige-100">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={product.nom} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-900/30">
            Photo à venir
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium">{product.nom}</h3>
        {prixFournisseur != null && (
          <p className="mt-1 text-sm text-ink-900/60">
            Prix fournisseur : {formatFCFA(prixFournisseur)}
          </p>
        )}
        {product.prix_min_conseille && product.prix_max_conseille && (
          <p className="mt-0.5 text-xs text-ink-900/50">
            Conseillé : {formatFCFA(product.prix_min_conseille)} – {formatFCFA(product.prix_max_conseille)}
          </p>
        )}
      </div>
    </a>
  );
}
