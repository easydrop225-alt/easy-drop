"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Media, ProductVariant } from "@/types/database";

export function MediaUploader({ productId }: { productId: string }) {
  const [media, setMedia] = useState<Media[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [variantSelectionnee, setVariantSelectionnee] = useState<string>("aucune");
  const [filtreVariante, setFiltreVariante] = useState<string>("toutes");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const loadMedia = useCallback(async () => {
    const { data } = await supabase.from("media").select("*").eq("product_id", productId).order("ordre");
    setMedia((data ?? []) as Media[]);
  }, [productId, supabase]);

  const loadVariants = useCallback(async () => {
    const { data } = await supabase.from("product_variants").select("*").eq("product_id", productId);
    setVariants((data ?? []) as ProductVariant[]);
  }, [productId, supabase]);

  useEffect(() => {
    loadMedia();
    loadVariants();
  }, [loadMedia, loadVariants]);

  function labelVariante(v: ProductVariant) {
    return [v.couleur, v.taille].filter(Boolean).join(" / ") || "Variante";
  }

  async function handleFiles(files: FileList | null, type: "image" | "video") {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);

    const variantId = variantSelectionnee !== "aucune" ? variantSelectionnee : null;

    try {
      for (const file of Array.from(files)) {
        const path = `${productId}/${type}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

        const { error: uploadError } = await supabase.storage
          .from("product-media")
          .upload(path, file, { cacheControl: "3600", upsert: false });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from("product-media").getPublicUrl(path);

        const { error: insertError } = await supabase.from("media").insert({
          product_id: productId,
          product_variant_id: variantId,
          type,
          url: publicUrlData.publicUrl,
          ordre: media.length,
        });

        if (insertError) throw insertError;
      }
      await loadMedia();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi du fichier.");
    } finally {
      setUploading(false);
    }
  }

  async function supprimerMedia(item: Media) {
    // Retire le fichier du stockage puis la ligne en base.
    const path = item.url.split("/product-media/")[1];
    if (path) {
      await supabase.storage.from("product-media").remove([decodeURIComponent(path)]);
    }
    await supabase.from("media").delete().eq("id", item.id);
    await loadMedia();
  }

  const mediaFiltre =
    filtreVariante === "toutes"
      ? media
      : filtreVariante === "sans_variante"
        ? media.filter((m) => !m.product_variant_id)
        : media.filter((m) => m.product_variant_id === filtreVariante);

  const images = mediaFiltre.filter((m) => m.type === "image");
  const videos = mediaFiltre.filter((m) => m.type === "video");

  return (
    <Card className="space-y-4">
      <h2 className="font-medium">Photos et vidéos</h2>

      {variants.length > 0 && (
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Associer les prochains fichiers à une variante précise (optionnel)
          </label>
          <select
            value={variantSelectionnee}
            onChange={(e) => setVariantSelectionnee(e.target.value)}
            className="h-10 w-full rounded-xl border border-ink-900/10 bg-surface px-3 text-sm"
          >
            <option value="aucune">Aucune — photo générale du produit</option>
            {variants.map((v) => (
              <option key={v.id} value={v.id}>{labelVariante(v)}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-ink-900/50">
            Utile si les couleurs/tailles se ressemblent peu visuellement : le commercial verra la bonne photo selon la variante choisie.
          </p>
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium">Ajouter des photos</label>
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={uploading}
          onChange={(e) => handleFiles(e.target.files, "image")}
          className="block w-full text-sm"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Ajouter des vidéos</label>
        <input
          type="file"
          accept="video/*"
          multiple
          disabled={uploading}
          onChange={(e) => handleFiles(e.target.files, "video")}
          className="block w-full text-sm"
        />
      </div>

      {uploading && <p className="text-sm text-ink-900/60">Envoi en cours...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {variants.length > 0 && media.length > 0 && (
        <div>
          <label className="mb-1.5 block text-sm font-medium">Filtrer l&apos;aperçu par variante</label>
          <select
            value={filtreVariante}
            onChange={(e) => setFiltreVariante(e.target.value)}
            className="h-9 w-full rounded-xl border border-ink-900/10 bg-surface px-3 text-sm"
          >
            <option value="toutes">Toutes les photos/vidéos</option>
            <option value="sans_variante">Photos générales (sans variante)</option>
            {variants.map((v) => (
              <option key={v.id} value={v.id}>{labelVariante(v)}</option>
            ))}
          </select>
        </div>
      )}

      {images.length > 0 && (
        <div>
          <p className="mb-2 text-sm text-ink-900/60">Photos ({images.length})</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {images.map((img) => {
              const variante = variants.find((v) => v.id === img.product_variant_id);
              return (
                <div key={img.id} className="group relative aspect-square overflow-hidden rounded-xl bg-beige-100">
                  <Image src={img.url} alt="" fill sizes="(max-width: 640px) 33vw, 25vw" className="object-cover" />
                  {variante && (
                    <span className="absolute bottom-1 left-1 rounded-full bg-surface/90 px-2 py-0.5 text-[10px] font-medium">
                      {labelVariante(variante)}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => supprimerMedia(img)}
                    className="absolute right-1 top-1 rounded-full bg-surface/90 px-2 py-0.5 text-xs opacity-0 transition group-hover:opacity-100"
                  >
                    Suppr.
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {videos.length > 0 && (
        <div>
          <p className="mb-2 text-sm text-ink-900/60">Vidéos ({videos.length})</p>
          <div className="space-y-2">
            {videos.map((v) => (
              <div key={v.id} className="flex items-center justify-between rounded-xl bg-beige-100 px-3 py-2 text-sm">
                <a href={v.url} target="_blank" rel="noreferrer" className="truncate text-terracotta-600 underline">
                  {v.url.split("/").pop()}
                </a>
                <Button size="sm" variant="danger" onClick={() => supprimerMedia(v)}>Supprimer</Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
