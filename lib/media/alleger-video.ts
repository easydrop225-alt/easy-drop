import type { SupabaseClient } from "@supabase/supabase-js";
import { compresserVideo } from "./compresser-video";

/**
 * Remplace une vidéo déjà en ligne par sa version allégée : téléchargement
 * dans le navigateur, compression, envoi du nouveau fichier, mise à jour du
 * média (même place, même variante), puis suppression de l'ancien fichier.
 */
export async function allegerVideoEnLigne(
  supabase: SupabaseClient,
  media: { id: string; product_id: string; url: string },
  onEtape: (texte: string) => void,
): Promise<{ avant: number; apres: number } | { erreur: string }> {
  onEtape("Téléchargement…");
  const reponse = await fetch(media.url);
  if (!reponse.ok) return { erreur: "Téléchargement impossible." };
  const blob = await reponse.blob();
  const nom = decodeURIComponent(media.url.split("/").pop() ?? "video.mp4").replace(/^\d+-/, "");

  const fichier = await compresserVideo(blob, nom, (p) => onEtape(`Compression… ${Math.round(p * 100)} %`));
  if (!fichier) return { erreur: "Ce navigateur ne peut pas compresser (utilise Chrome ou un iPhone à jour), ou la vidéo est déjà légère." };

  onEtape("Envoi…");
  const chemin = `${media.product_id}/video/${Date.now()}-${fichier.name}`;
  const { error: e1 } = await supabase.storage.from("product-media").upload(chemin, fichier, { cacheControl: "31536000", upsert: false });
  if (e1) return { erreur: e1.message };
  const { data } = supabase.storage.from("product-media").getPublicUrl(chemin);
  const { error: e2 } = await supabase.from("media").update({ url: data.publicUrl }).eq("id", media.id);
  if (e2) {
    await supabase.storage.from("product-media").remove([chemin]);
    return { erreur: e2.message };
  }
  const ancien = media.url.split("/product-media/")[1];
  if (ancien) await supabase.storage.from("product-media").remove([decodeURIComponent(ancien)]);
  return { avant: blob.size, apres: fichier.size };
}
