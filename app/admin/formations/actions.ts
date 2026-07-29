"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function creerFormation(_prevState: unknown, formData: FormData) {
  const titre = String(formData.get("titre") ?? "").trim();
  const videoUrl = String(formData.get("videoUrl") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (titre.length < 2) return { error: "Le titre est requis." };
  if (!videoUrl) return { error: "Le lien vidéo est requis." };

  const supabase = await createClient();
  const { data: existantes } = await supabase.from("formations").select("ordre").order("ordre", { ascending: false }).limit(1);
  const prochainOrdre = ((existantes?.[0]?.ordre as number | undefined) ?? 0) + 1;

  const { error } = await supabase.from("formations").insert({
    titre, video_url: videoUrl, description: description || null, ordre: prochainOrdre,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/formations");
  return { success: true };
}

export async function modifierFormation(id: string, donnees: { titre: string; description: string; videoUrl: string }) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("formations")
    .update({ titre: donnees.titre, description: donnees.description || null, video_url: donnees.videoUrl })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/formations");
  return { success: true };
}

export async function basculerActifFormation(id: string, actif: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("formations").update({ actif }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/formations");
  return { success: true };
}

export async function supprimerFormation(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("formations").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/formations");
  return { success: true };
}
