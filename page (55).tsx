"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function marquerNotificationLue(notificationId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("notifications").update({ lu: true }).eq("id", notificationId);
  if (error) return { error: error.message };
  revalidatePath("/notifications");
  return { success: true };
}

export async function marquerToutesLues() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée." };
  const { error } = await supabase.from("notifications").update({ lu: true }).eq("destinataire_id", user.id).eq("lu", false);
  if (error) return { error: error.message };
  revalidatePath("/notifications");
  return { success: true };
}
