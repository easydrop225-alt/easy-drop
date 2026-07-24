import { createClient } from "@/lib/supabase/server";
import type { Setting } from "@/types/database";
import { ParametresForm } from "./form";

export default async function ParametresPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase.from("settings").select("*");
  const list = (settings ?? []) as Setting[];
  const get = (cle: string) => list.find((s) => s.cle === cle)?.valeur;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold">Paramètres</h1>
      <ParametresForm
        fraisAbidjan={get("frais_livraison_abidjan") as { min: number; max: number } | undefined}
        fraisHorsAbidjan={get("frais_livraison_hors_abidjan") as { min: number; max: number } | undefined}
        whatsapp={get("whatsapp_numero") as string | undefined}
        horaires={get("horaires") as string | undefined}
      />
    </div>
  );
}
