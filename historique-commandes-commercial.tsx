"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AvatarUploader({ userId, photoUrl }: { userId: string; photoUrl: string | null }) {
  const [url, setUrl] = useState(photoUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      const path = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { cacheControl: "3600", upsert: true });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(path);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ photo_url: publicUrlData.publicUrl })
        .eq("id", userId);
      if (updateError) throw updateError;

      setUrl(publicUrlData.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi de la photo.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="h-16 w-16 overflow-hidden rounded-full bg-beige-100">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="Photo de profil" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-ink-900/30">Photo</div>
        )}
      </div>
      <div>
        <label className="cursor-pointer rounded-xl border border-ink-900/10 bg-white px-3 py-1.5 text-sm hover:bg-beige-100">
          {uploading ? "Envoi..." : "Changer la photo"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
