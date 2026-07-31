"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function RecuExpeditionUploader({
  orderId,
  recuActuel,
}: {
  orderId: string;
  recuActuel: string | null;
}) {
  const [url, setUrl] = useState(recuActuel);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      const path = `${orderId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

      const { error: uploadError } = await supabase.storage
        .from("shipment-receipts")
        .upload(path, file, { cacheControl: "3600", upsert: true });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from("shipment-receipts").getPublicUrl(path);

      const { error: updateError } = await supabase
        .from("orders")
        .update({ recu_expedition_url: publicUrlData.publicUrl })
        .eq("id", orderId);
      if (updateError) throw updateError;

      setUrl(publicUrlData.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi du reçu.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      {url && (
        <div className="w-32 overflow-hidden rounded-xl bg-beige-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Reçu d'expédition" className="w-full object-cover" />
        </div>
      )}
      <label className="inline-block cursor-pointer rounded-xl border border-ink-900/10 bg-surface px-3 py-1.5 text-sm hover:bg-beige-100">
        {uploading ? "Envoi..." : url ? "Remplacer la photo du reçu" : "Ajouter la photo du reçu"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={uploading}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!url && (
        <p className="text-xs text-ink-900/40">
          Cette photo sera téléchargeable par le commercial une fois la commande marquée comme livrée/terminée.
        </p>
      )}
      {url && (
        <Button size="sm" variant="secondary" onClick={() => window.open(url, "_blank")}>
          Voir en grand
        </Button>
      )}
    </div>
  );
}
