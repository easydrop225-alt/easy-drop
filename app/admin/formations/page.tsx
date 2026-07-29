import { createClient } from "@/lib/supabase/server";
import type { Formation } from "@/types/database";
import { NouvelleFormationForm } from "./nouvelle-form";
import { FormationRow } from "./formation-row";

export default async function FormationsPage() {
  const supabase = await createClient();
  const { data: formations } = await supabase.from("formations").select("*").order("ordre");
  const list = (formations ?? []) as Formation[];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Espace formation</h1>
      <p className="text-sm text-ink-900/60">
        Ajoute ici de petites vidéos (YouTube ou Vimeo) que les commerciaux pourront consulter depuis leur profil.
      </p>
      <NouvelleFormationForm />
      <div className="space-y-2">
        {list.map((f) => <FormationRow key={f.id} formation={f} />)}
        {list.length === 0 && <p className="text-ink-900/60">Aucune vidéo de formation pour l'instant.</p>}
      </div>
    </div>
  );
}
