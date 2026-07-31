import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatFCFA } from "@/lib/utils";
import type { Product, Media, ProductVariant } from "@/types/database";

export default async function MediasProduitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase.from("products").select("*").eq("id", id).single();
  if (!product) notFound();

  const { data: media } = await supabase.from("media").select("*").eq("product_id", id).order("ordre");
  const { data: variants } = await supabase.from("product_variants").select("*").eq("product_id", id);

  const list = (media ?? []) as Media[];
  const listeVariantes = (variants ?? []) as ProductVariant[];

  function labelVariante(v: ProductVariant) {
    return [v.couleur, v.taille].filter(Boolean).join(" / ") || "Variante";
  }

  // Regroupe les médias par variante : d'abord les photos générales (sans
  // variante précise), puis une section par variante qui a ses propres
  // médias — utile quand les couleurs sont visuellement très différentes.
  const imagesGenerales = list.filter((m) => m.type === "image" && !m.product_variant_id);
  const videosGenerales = list.filter((m) => m.type === "video" && !m.product_variant_id);
  const variantesAvecMedia = listeVariantes
    .map((v) => ({
      variante: v,
      images: list.filter((m) => m.type === "image" && m.product_variant_id === v.id),
      videos: list.filter((m) => m.type === "video" && m.product_variant_id === v.id),
    }))
    .filter((g) => g.images.length > 0 || g.videos.length > 0);

  function GalerieMedia({ images, videos }: { images: Media[]; videos: Media[] }) {
    return (
      <>
        {images.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((img) => (
              <div key={img.id} className="space-y-2">
                <div className="aspect-square overflow-hidden rounded-xl bg-beige-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                </div>
                <a href={img.url} download target="_blank" rel="noreferrer">
                  <Button size="sm" variant="secondary" className="w-full">Télécharger</Button>
                </a>
              </div>
            ))}
          </div>
        )}
        {videos.length > 0 && (
          <div className="mt-3 space-y-3">
            {videos.map((v) => (
              <div key={v.id} className="space-y-2 rounded-xl bg-beige-100 p-3">
                <video src={v.url} controls className="w-full rounded-lg" />
                <a href={v.url} download target="_blank" rel="noreferrer">
                  <Button size="sm" variant="secondary" className="w-full">Télécharger</Button>
                </a>
              </div>
            ))}
          </div>
        )}
        {images.length === 0 && videos.length === 0 && (
          <p className="text-sm text-ink-900/50">Aucun média disponible.</p>
        )}
      </>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{(product as Product).nom}</h1>
          <p className="text-sm text-ink-900/60">Prix fournisseur : {formatFCFA((product as Product).prix_fournisseur)}</p>
        </div>
        <a
          href={`/commandes/nouvelle?produit=${id}`}
          className="rounded-xl bg-terracotta-500 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-600"
        >
          Créer une commande
        </a>
      </div>

      <Card>
        <h2 className="mb-3 font-medium">
          {variantesAvecMedia.length > 0 ? "Photos générales" : `Photos (${imagesGenerales.length})`}
        </h2>
        <GalerieMedia images={imagesGenerales} videos={videosGenerales} />
      </Card>

      {variantesAvecMedia.map(({ variante, images, videos }) => (
        <Card key={variante.id} className="mt-4">
          <h2 className="mb-3 font-medium">{labelVariante(variante)} ({images.length})</h2>
          <GalerieMedia images={images} videos={videos} />
        </Card>
      ))}
    </div>
  );
}
