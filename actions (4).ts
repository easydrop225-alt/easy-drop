import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { Profile } from "@/types/database";
import { ValidationActions } from "./actions-buttons";

export default async function ValidationCommerciauxPage() {
  const supabase = await createClient();
  const { data: commerciaux } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "commercial")
    .eq("statut", "en_attente")
    .order("created_at");

  const list = (commerciaux ?? []) as Profile[];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Validation des inscriptions</h1>
      <div className="space-y-3">
        {list.map((c) => (
          <Card key={c.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium">{c.prenom} {c.nom}</p>
              <p className="text-sm text-ink-900/60">{c.telephone} — inscrit le {formatDate(c.created_at)}</p>
            </div>
            <ValidationActions commercialId={c.id} />
          </Card>
        ))}
        {list.length === 0 && <p className="text-ink-900/60">Aucune inscription en attente.</p>}
      </div>
    </div>
  );
}
