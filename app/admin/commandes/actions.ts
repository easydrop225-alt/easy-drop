"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { OrderStatut } from "@/types/database";

export async function changerStatutCommande(orderId: string, statut: OrderStatut, motif?: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ statut, motif_annulation: motif ?? null })
    .eq("id", orderId);

  if (error) return { error: error.message };
  revalidatePath("/admin/commandes");
  return { success: true };
}
