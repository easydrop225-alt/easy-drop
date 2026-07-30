"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Media } from "@/types/database";

export function MediaUploader({ productId }: { productId: string }) {
  const [media, setMedia] = useState<Media[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const loadMedia = useCallback(async () => {
    const { data } = await supabase.from("media").select("*").eq("product_id", productId).order("ordre");
    setMedia((data ?? []) as Media[]);
  }, [productId, supabase]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  async function handleFiles(files: FileList | null, type: "image" | "video") {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);

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

  const images = media.filter((m) => m.type === "image");
  const videos = media.filter((m) => m.type === "video");

  return (
    <Card className="space-y-4">
      <h2 className="font-medium">Photos et vidéos</h2>

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

      {images.length > 0 && (
        <div>
          <p className="mb-2 text-sm text-ink-900/60">Photos ({images.length})</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {images.map((img) => (
              <div key={img.id} className="group relative aspect-square overflow-hidden rounded-xl bg-beige-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => supprimerMedia(img)}
                  className="absolute right-1 top-1 rounded-full bg-white/90 px-2 py-0.5 text-xs opacity-0 transition group-hover:opacity-100"
                >
                  Suppr.
                </button>
              </div>
            ))}
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
