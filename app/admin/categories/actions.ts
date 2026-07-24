"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function slugify(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function creerCategorie(_prevState: unknown, formData: FormData) {
  const nom = String(formData.get("nom") ?? "").trim();
  if (nom.length < 2) return { error: "Le nom de la catégorie est trop court." };

  const supabase = await createClient();

  const { count } = await supabase.from("categories").select("*", { count: "exact", head: true });

  const { error } = await supabase.from("categories").insert({
    nom,
    slug: slugify(nom) + "-" + Date.now().toString(36),
    ordre: (count ?? 0) + 1,
    actif: true,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/categories");
  return { success: true };
}

export async function basculerCategorie(categoryId: string, actif: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").update({ actif }).eq("id", categoryId);
  if (error) return { error: error.message };
  revalidatePath("/admin/categories");
  return { success: true };
}

export async function renommerCategorie(categoryId: string, nom: string) {
  if (nom.trim().length < 2) return { error: "Nom trop court." };
  const supabase = await createClient();
  const { error } = await supabase.from("categories").update({ nom: nom.trim() }).eq("id", categoryId);
  if (error) return { error: error.message };
  revalidatePath("/admin/categories");
  return { success: true };
}
