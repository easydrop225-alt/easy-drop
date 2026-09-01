import Image from "next/image";
import Link from "next/link";
import { formatFCFA } from "@/lib/utils";
import { FavoriBouton } from "./favori-bouton";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types/database";

interface ProductCardProps {
  product: Pick<Product, "id" | "nom" | "slug" | "prix_min_conseille" | "prix_max_conseille"> & {
    couleurs?: string[];
    tailles?: string[];
  };
  imageUrl?: string;
  prixFournisseur?: number; // affiché uniquement côté commercial
  href: string;
  disponible?: boolean; // rupture de stock — absent = non pertinent (ex: vitrine publique)
  actif?: boolean; // produit désactivé par l'admin — absent = toujours considéré actif
  nouveau?: boolean; // ajouté il y a moins d'un mois
  favoris?: boolean; // affiche le bouton cœur (désactivé sur la vitrine publique)
}

function resumeVariantes(couleurs?: string[], tailles?: string[]) {
  const parties: string[] = [];
  if (couleurs && couleurs.length > 0) {
    const apercu = couleurs.slice(0, 3).join(", ");
    parties.push(couleurs.length > 3 ? `${apercu} +${couleurs.length - 3}` : apercu);
  }
  if (tailles && tailles.length > 0) {
    parties.push(tailles.join(", "));
  }
  return parties.length > 0 ? parties.join(" · ") : null;
}

export function ProductCard({ product, imageUrl, prixFournisseur, href, disponible, actif = true, nouveau, favoris = true }: ProductCardProps) {
  const indisponible = disponible === false;

  // Un produit désactivé par l'admin ne montre plus rien d'autre que sa
  // photo de couverture, très grisée, et n'est plus cliquable — il n'y a
  // volontairement plus aucune information (prix, variantes) à afficher.
  if (!actif) {
    return (
      <div className="overflow-hidden rounded-2xl border border-ink-900/5 bg-surface opacity-40 grayscale">
        <div className="relative aspect-square w-full bg-beige-100">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-ink-900/30">Photo à venir</div>
          )}
        </div>
      </div>
    );
  }

  const variantes = resumeVariantes(product.couleurs, product.tailles);

  return (
    <div className={`group relative overflow-hidden rounded-2xl border border-ink-900/5 bg-surface transition hover:shadow-md ${indisponible ? "opacity-50 hover:opacity-70" : ""}`}>
      {favoris && <FavoriBouton productId={product.id} />}
      {nouveau && !indisponible && (
        <span className="absolute left-2 top-2 z-10 rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          Nouveau
        </span>
      )}
      <Link href={href} prefetch>
        <div className="relative aspect-square w-full bg-beige-100">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.nom}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-ink-900/30">
              Photo à venir
            </div>
          )}
          {indisponible && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink-900/20">
              <span className="rounded-full bg-ink-900/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                Non disponible
              </span>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="truncate font-medium">{product.nom}</h3>
          {prixFournisseur != null && (
            <p className="mt-1 whitespace-nowrap text-sm text-ink-900/50">
              Fournisseur : <span className="font-medium text-ink-900/70">{formatFCFA(prixFournisseur)}</span>
            </p>
          )}
          {product.prix_min_conseille && product.prix_max_conseille && (
            <p className="mt-0.5 whitespace-nowrap text-sm text-terracotta-600">
              Revente : <span className="font-semibold">{formatFCFA(product.prix_min_conseille)}–{formatFCFA(product.prix_max_conseille)}</span>
            </p>
          )}
          {variantes && <p className="mt-1 truncate text-xs text-ink-900/40">{variantes}</p>}
        </div>
      </Link>
      <div className="px-4 pb-4">
        <Link href={href} prefetch>
          <Button size="sm" variant="secondary" className="w-full">Voir le produit</Button>
        </Link>
      </div>
    </div>
  );
}
