"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function terminerOnboarding() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée." };

  const { error } = await supabase.from("profiles").update({ onboarding_termine: true }).eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/accueil");
  return { success: true };
}
