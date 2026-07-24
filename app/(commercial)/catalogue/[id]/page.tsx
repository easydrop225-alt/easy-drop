import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatFCFA } from "@/lib/utils";
import type { Product, Media } from "@/types/database";

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
  const list = (media ?? []) as Media[];
  const images = list.filter((m) => m.type === "image");
  const videos = list.filter((m) => m.type === "video");

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
        <h2 className="mb-3 font-medium">Photos ({images.length})</h2>
        {images.length === 0 ? (
          <p className="text-sm text-ink-900/50">Aucune photo disponible pour ce produit.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((img) => (
              <div key={img.id} className="space-y-2">
                <div className="aspect-square overflow-hidden rounded-xl bg-beige-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </div>
                <a href={img.url} download target="_blank" rel="noreferrer">
                  <Button size="sm" variant="secondary" className="w-full">Télécharger</Button>
                </a>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="mt-4">
        <h2 className="mb-3 font-medium">Vidéos ({videos.length})</h2>
        {videos.length === 0 ? (
          <p className="text-sm text-ink-900/50">Aucune vidéo disponible pour ce produit.</p>
        ) : (
          <div className="space-y-3">
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
      </Card>
    </div>
  );
}
