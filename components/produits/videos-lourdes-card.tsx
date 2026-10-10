"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LigneVideo, type VideoEnLigne } from "./ligne-video";

/**
 * Admin > Produits : toutes les vidéos du catalogue avec leur poids, pour
 * alléger en un clic celles qui consomment la bande passante Supabase.
 */
export function VideosLourdesCard({ videos }: { videos: (VideoEnLigne & { produit: string })[] }) {
  const [declencheur, setDeclencheur] = useState(0);
  if (videos.length === 0) return null;
  return (
    <Card className="mb-6 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-medium">🎬 Poids des vidéos</h2>
          <p className="text-xs text-ink-900/50">
            Au-delà de 8 Mo (en rouge), une vidéo use vite le quota gratuit. « Alléger » la convertit en 720p dans ce navigateur, sans perte visible sur téléphone.
          </p>
        </div>
        <Button size="sm" onClick={() => setDeclencheur((n) => n + 1)}>⚡ Tout alléger</Button>
      </div>
      <div className="space-y-2">
        {videos.map((v) => (
          <LigneVideo key={v.id} video={v} titre={v.produit} declencheur={declencheur} />
        ))}
      </div>
    </Card>
  );
}
