import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import type { Profile } from "@/types/database";

export default async function ProfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user?.id).single();
  const p = profile as Profile | null;

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-semibold">Mon profil</h1>
      <Card className="space-y-3 text-sm">
        <p><span className="text-ink-900/50">Nom : </span>{p?.prenom} {p?.nom}</p>
        <p><span className="text-ink-900/50">Téléphone : </span>{p?.telephone}</p>
        <p><span className="text-ink-900/50">Email : </span>{p?.email ?? "—"}</p>
        <p><span className="text-ink-900/50">Statut : </span>{p?.statut}</p>
      </Card>
    </div>
  );
}
