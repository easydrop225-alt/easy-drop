"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function SonNotificationUploader({ sonActuelUrl }: { sonActuelUrl: string | null }) {
  const [url, setUrl] = useState(sonActuelUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

      const { error: uploadError } = await supabase.storage
        .from("notification-sounds")
        .upload(path, file, { cacheControl: "3600", upsert: true });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from("notification-sounds").getPublicUrl(path);

      const { error: settingError } = await supabase
        .from("settings")
        .upsert({ cle: "son_notification_url", valeur: publicUrlData.publicUrl }, { onConflict: "cle" });
      if (settingError) throw settingError;

      setUrl(publicUrlData.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi du son.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-900/60">
        Ce son se joue automatiquement dès qu'un commercial enregistre une nouvelle commande, tant que cette page (ou l'application installée) est ouverte.
      </p>
      {url && (
        <audio controls src={url} className="w-full">
          Ton navigateur ne supporte pas la lecture audio.
        </audio>
      )}
      <label className="inline-block cursor-pointer rounded-xl border border-ink-900/10 bg-white px-3 py-1.5 text-sm hover:bg-beige-100">
        {uploading ? "Envoi..." : url ? "Remplacer le son" : "Choisir un fichier son (MP3/WAV)"}
        <input
          type="file"
          accept="audio/*"
          className="hidden"
          disabled={uploading}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
