"use server";

import { createClient } from "@/lib/supabase/server";
import { paiementSchema } from "@/lib/validations/schemas";
import { revalidatePath } from "next/cache";

export async function enregistrerPaiement(_prevState: unknown, formData: FormData) {
  const raw = {
    commercialId: formData.get("commercialId"),
    montant: formData.get("montant"),
    mode: formData.get("mode"),
    referencePaiement: formData.get("referencePaiement") || undefined,
  };

  const parsed = paiementSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const supabase = await createClient();
  const { error } = await supabase.from("payments").insert({
    commercial_id: parsed.data.commercialId,
    montant: parsed.data.montant,
    mode: parsed.data.mode,
    reference_paiement: parsed.data.referencePaiement ?? null,
    statut: "paye",
    date_paiement: new Date().toISOString().slice(0, 10),
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/paiements");
  return { success: true };
}
